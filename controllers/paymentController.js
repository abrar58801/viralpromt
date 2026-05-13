const db = require("../config/db");
const axios = require("axios");

exports.verifyUTR = async (req, res) => {
  try {
    const { utr_number, amount } = req.body;

    if (!req.session.user) {
      return res.json({
        success: false,
        message: "Login required",
      });
    }

    const userId = req.session.user.id;
    const referred_by = req.session.user.referred_by;

    // Settings
    const [settings] = await db.query(
      "SELECT * FROM site_settings WHERE id = 1"
    );

    if (!settings.length) {
      return res.json({
        success: false,
        message: "Settings not found",
      });
    }

    const {
      paytm_mid,
      refer_percent,
      min_deposit
    } = settings[0];

    const earnByRefer =
      (Number(amount) * Number(refer_percent || 0)) / 100;

    if (Number(amount) < Number(min_deposit)) {
      return res.json({
        success: false,
        message: "Amount should be minimum ₹" + min_deposit,
      });
    }

    // Duplicate check
    const [existing] = await db.query(
      "SELECT * FROM transactions WHERE utr_number = ?",
      [utr_number]
    );

    if (existing.length > 0) {
      return res.json({
        success: false,
        message: "This Order ID is already used!",
      });
    }

    // Same like PHP
    const requestBody = {
      MID: paytm_mid,
      ORDERID: utr_number,
    };

    console.log("PAYTM REQUEST:", requestBody);

    const response = await axios.post(
      "https://securegw.paytm.in/merchant-status/getTxnStatus",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("PAYTM RESPONSE:", response.data);

    const status = response.data.STATUS;
    const txnAmount = response.data.TXNAMOUNT;
    const txnDate = response.data.TXNDATE;

    // 24 hour validation like PHP
    if (txnDate) {
      const txTime = new Date(txnDate);
      const now = new Date();
      const diffHours =
        (now - txTime) / (1000 * 60 * 60);

      if (diffHours > 24) {
        return res.json({
          success: false,
          message: "Transaction is older than 24 hours.",
        });
      }
    }

    if (
      status === "TXN_SUCCESS" &&
      Number(txnAmount) === Number(amount)
    ) {
      // Add wallet
      await db.query(
        "UPDATE users SET wallet_credits = wallet_credits + ? WHERE id = ?",
        [amount, userId]
      );

      // Deposit log
      await db.query(
        `INSERT INTO transactions
        (
          user_id,
          amount,
          credits_added,
          order_id,
          utr_number,
          type,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          amount,
          amount,
          utr_number,
          utr_number,
          "deposit",
          "success",
        ]
      );

      // Referral
      if (earnByRefer >= 1 && referred_by) {
        const [refUsers] = await db.query(
          "SELECT * FROM users WHERE referral_code = ? LIMIT 1",
          [referred_by]
        );

        if (refUsers.length) {
          await db.query(
            "UPDATE users SET wallet_credits = wallet_credits + ? WHERE id = ?",
            [earnByRefer, refUsers[0].id]
          );

          await db.query(
            `INSERT INTO transactions
            (
              user_id,
              amount,
              credits_added,
              order_id,
              utr_number,
              type,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              refUsers[0].id,
              earnByRefer,
              earnByRefer,
              utr_number+"r",
              utr_number+"r",
              "referral",
              "success",
            ]
          );
        }
      }

      return res.json({
        success: true,
        message: "Payment Verified! Credits Added.",
      });
    }

    if (status === "TXN_FAILURE") {
      return res.json({
        success: false,
        message:
          response.data.RESPMSG || "Transaction failed",
      });
    }

    return res.json({
      success: false,
      message: "Transaction not found or pending.",
    });

  } catch (err) {
    console.log(err?.response?.data || err);

    return res.json({
      success: false,
      message: "Server Error during verification.",
    });
  }
};

exports.verifyBharatPayUTR = async (req, res) => {
  try {
    const { utr_number, amount } = req.body;

    if (!req.session.user) {
      return res.json({
        success: false,
        message: "Login required",
      });
    }

    const userId = req.session.user.id;
    const referred_by = req.session.user.referred_by;

    // Settings
    const [settings] = await db.query(
      "SELECT * FROM site_settings WHERE id = 1"
    );

    if (!settings.length) {
      return res.json({
        success: false,
        message: "Settings not found",
      });
    }

    const {
      bharatpe_mid,
      bharatpe_token,
      refer_percent,
      min_deposit
    } = settings[0];

    if (!bharatpe_mid || !bharatpe_token) {
      return res.json({
        success: false,
        message: "BharatPe credentials missing",
      });
    }

    if (!utr_number) {
      return res.json({
        success: false,
        message: "Please enter UTR / Reference ID",
      });
    }

    if (Number(amount) < Number(min_deposit)) {
      return res.json({
        success: false,
        message: "Minimum deposit ₹" + min_deposit,
      });
    }

    // Duplicate check
    const [existing] = await db.query(
      "SELECT id FROM transactions WHERE utr_number = ?",
      [utr_number]
    );

    if (existing.length > 0) {
      return res.json({
        success: false,
        message: "This UTR / Reference ID already used",
      });
    }

    const earnByRefer =
      (Number(amount) * Number(refer_percent || 0)) / 100;

    // Date range (last 2 days)
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 2);

    const formatDate = (date) => {
      return date.toISOString().split("T")[0];
    };

    const sDate = formatDate(twoDaysAgo);
    const eDate = formatDate(today);

    // BharatPe API
    const response = await axios.get(
      `https://payments-tesseract.bharatpe.in/api/v1/merchant/transactions`,
      {
        params: {
          module: "PAYMENT_QR",
          merchantId: bharatpe_mid,
          sDate,
          eDate,
        },
        headers: {
          token: bharatpe_token,
          "user-agent":
            "Mozilla/5.0",
        },
      }
    );

    const transactions =
      response.data?.data?.transactions || [];

    // Match by multiple fields
    const matchedTransaction = transactions.find(
      (tx) =>
        tx.bankReferenceNo == utr_number ||
        tx.txnRefId == utr_number ||
        tx.merchantTransactionId == utr_number
    );

    if (!matchedTransaction) {
      return res.json({
        success: false,
        message: "UTR / Reference ID not found",
      });
    }

    // Status check
    if (matchedTransaction.status !== "SUCCESS") {
      return res.json({
        success: false,
        message: "Transaction is not successful yet",
      });
    }

    // Amount check
    if (
      Number(matchedTransaction.amount) !==
      Number(amount)
    ) {
      return res.json({
        success: false,
        message: "Amount mismatch",
      });
    }

    // Wallet credit
    await db.query(
      `
      UPDATE users
      SET wallet_credits = wallet_credits + ?
      WHERE id = ?
      `,
      [amount, userId]
    );

    // Deposit transaction
    await db.query(
      `
      INSERT INTO transactions
      (
        user_id,
        amount,
        credits_added,
        order_id,
        utr_number,
        type,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        amount,
        amount,
        matchedTransaction.merchantTransactionId ||
          utr_number,
        utr_number,
        "deposit",
        "success",
      ]
    );

    // Referral bonus
    if (earnByRefer >= 1 && referred_by) {
      const [refUsers] = await db.query(
        `
        SELECT *
        FROM users
        WHERE referral_code = ?
        LIMIT 1
        `,
        [referred_by]
      );

      if (refUsers.length) {
        await db.query(
          `
          UPDATE users
          SET wallet_credits = wallet_credits + ?
          WHERE id = ?
          `,
          [earnByRefer, refUsers[0].id]
        );

        await db.query(
          `
          INSERT INTO transactions
          (
            user_id,
            amount,
            credits_added,
            order_id,
            utr_number,
            type,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?)
          `,
          [
            refUsers[0].id,
            earnByRefer,
            earnByRefer,
            (matchedTransaction.merchantTransactionId ||
              utr_number) + "-REF",
            utr_number + "-REF",
            "referral",
            "success",
          ]
        );
      }
    }

    return res.json({
      success: true,
      message: "Payment verified successfully",
    });

  } catch (err) {
    console.log(
      err?.response?.data || err
    );

    return res.json({
      success: false,
      message:
        "Verification failed. Try again.",
    });
  }
};

// //  old not working
// const db = require("../config/db");
// const PaytmChecksum = require("paytmchecksum");
// const axios = require("axios");

// exports.verifyUTR = async (req, res) => {
//   const { utr_number, amount } = req.body;
//   const userId = req.session.user.id;
//   const referred_by = req.session.user.referred_by;

//   // Admin Settings se Paytm Keys uthana (Table: site_settings)
//   const [settings] = await db.query("SELECT * FROM site_settings WHERE id = 1");
//   const { paytm_mid, paytm_mkey, refer_percent, min_deposit } = settings[0];
//   const earnByRefer = (amount * refer_percent) / 100 || 0;

//   if (amount < min_deposit) {
//     return res.json({
//       success: false,
//       message: "❌ Amount should be ." + min_deposit,
//     });
//   }

//   /* Paytm API body */
//   var paytmParams = {};
//   paytmParams.body = {
//     mid: paytm_mid,
//     orderId: utr_number, // Aksar UTR ko hi orderId maan kar check kiya jata hai ya txnId
//   };

//   // Checksum generate karna
//   PaytmChecksum.generateSignature(
//     JSON.stringify(paytmParams.body),
//     paytm_mkey,
//   ).then(function (checksum) {
//     paytmParams.head = {
//       signature: checksum,
//     };

//     var post_data = JSON.stringify(paytmParams);

//     // Paytm Status Query API URL (Production URL)
//     const url = `https://securegw.paytm.in/v3/order/status`;

//     axios
//       .post(url, post_data, {
//         headers: { "Content-Type": "application/json" },
//       })
//       .then(async (response) => {
//         const status = response.data.body.resultInfo.resultStatus;
//         const txnAmount = response.data.body.txnAmount;

//         if (
//           status === "TXN_SUCCESS" &&
//           parseFloat(txnAmount) === parseFloat(amount)
//         ) {
//           // 1. Double deposit check (UTR pehle use toh nahi hua?)
//           const [check] = await db.query(
//             "SELECT * FROM transactions WHERE utr_number = ?",
//             [utr_number],
//           );

//           if (check.length === 0) {
//             // 2. Credits add karna (1 Rs = 1 Credit)
//             await db.query(
//               "UPDATE users SET wallet_credits = wallet_credits + ? WHERE id = ?",
//               [amount, userId],
//             );

//             // 3. Log transaction
//             await db.query(
//               'INSERT INTO transactions (user_id, amount, utr_number, type, status) VALUES (?, ?, ?, "deposit", "success")',
//               [userId, amount, utr_number],
//             );

//             // earn by refer
//             if (earnByRefer >= 1) {
//               const [checkWhoRefer] = await db.query(
//                 "SELECT * FROM users WHERE referral_code = ? ORDER BY id DESC LIMIT 1",
//                 [referred_by],
//               );
//               if (checkWhoRefer.length === 1) {
//                 await db.query(
//                   "UPDATE users SET wallet_credits = wallet_credits + ? WHERE id = ?",
//                   [earnByRefer, checkWhoRefer[0].id],
//                 );

//                 // 3. Log transaction
//                 await db.query(
//                   'INSERT INTO transactions (user_id, amount, utr_number, type, status) VALUES (?, ?, ?, "earn", "success")',
//                   [checkWhoRefer[0].id, earnByRefer, utr_number + "e"],
//                 );
//               }
//             }

//             return res.json({
//               success: true,
//               message: "✅ Payment Verified! Credits Added.",
//             });
//           } else {
//             return res.json({
//               success: false,
//               message: "❌ This UTR is already used!",
//             });
//           }
//         } else {
//           return res.json({
//             success: false,
//             message: "❌ Transaction not found or Pending at Paytm.",
//           });
//         }
//       })
//       .catch((err) => {
//         console.error(err);
//         res.json({
//           success: false,
//           message: "Server Error during verification.",
//         });
//       });
//   });
// };


//   try {
//     const { utr_number, amount } = req.body;
//     const paytmOrderId = utr_number;

//     if (!req.session.user) {
//       return res.json({
//         success: false,
//         message: "Login required",
//       });
//     }

//     if (!paytmOrderId) {
//       return res.json({
//         success: false,
//         message: "Order ID cannot be empty",
//       });
//     }

//     const userId = req.session.user.id;
//     const referred_by = req.session.user.referred_by;

//     // Settings
//     const [settingsRows] = await db.query(
//       `SELECT * FROM site_settings WHERE id = 1`
//     );

//     if (!settingsRows.length) {
//       return res.json({
//         success: false,
//         message: "Settings not found",
//       });
//     }

//     const settings = settingsRows[0];

//     // Trim credentials
//     const paytm_mid = settings.paytm_mid?.trim();
//     const paytm_mkey = settings.paytm_mkey?.trim();

//     const refer_percent = Number(settings.refer_percent || 0);
//     const min_deposit = Number(settings.min_deposit || 0);

//     console.log("==================================");
//     console.log("PAYTM DEBUG");
//     console.log("MID:", paytm_mid);
//     console.log("MKEY:", paytm_mkey);
//     console.log("KEY LENGTH:", paytm_mkey?.length);
//     console.log("ORDER ID:", paytmOrderId);
//     console.log("AMOUNT:", amount);
//     console.log("==================================");

//     if (!paytm_mid || !paytm_mkey) {
//       return res.json({
//         success: false,
//         message: "Paytm settings missing",
//       });
//     }

//     // Common invalid key lengths
//     if (paytm_mkey.length < 16) {
//       return res.json({
//         success: false,
//         message:
//           "Invalid Paytm Merchant Key. Please check admin settings.",
//       });
//     }

//     if (Number(amount) < min_deposit) {
//       return res.json({
//         success: false,
//         message: `Minimum deposit ₹${min_deposit}`,
//       });
//     }

//     // Duplicate check
//     const [existing] = await db.query(
//       `SELECT id
//        FROM transactions
//        WHERE utr_number = ?`,
//       [paytmOrderId]
//     );

//     if (existing.length) {
//       return res.json({
//         success: false,
//         message: "This Order ID is already used",
//       });
//     }

//     const body = {
//       mid: paytm_mid,
//       orderId: paytmOrderId,
//     };

//     let checksum;

//     try {
//       checksum = await PaytmChecksum.generateSignature(
//         JSON.stringify(body),
//         paytm_mkey
//       );

//       console.log("CHECKSUM GENERATED SUCCESSFULLY");
//     } catch (err) {
//       console.log("CHECKSUM ERROR:", err);

//       return res.json({
//         success: false,
//         message:
//           "Paytm Merchant Key invalid. Fix admin payment settings.",
//       });
//     }

//     let response;

//     try {
//       // Change to staging if testing
//       response = await axios.post(
//         "https://securegw.paytm.in/v3/order/status",
//         {
//           body,
//           head: {
//             signature: checksum,
//           },
//         },
//         {
//           headers: {
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       console.log("PAYTM RESPONSE:");
//       console.log(
//         JSON.stringify(
//           response.data,
//           null,
//           2
//         )
//       );

//     } catch (err) {
//       console.log("PAYTM API ERROR:");
//       console.log(
//         JSON.stringify(
//           err?.response?.data,
//           null,
//           2
//         )
//       );

//       return res.json({
//         success: false,
//         message:
//           err?.response?.data?.body?.resultInfo?.resultMsg ||
//           err.message,
//       });
//     }

//     const result = response.data?.body;
//     const status = result?.resultInfo?.resultStatus;
//     const txnAmount = Number(result?.txnAmount || 0);
//     const txnDate = result?.txnDate;

//     // 24 hour check
//     if (txnDate) {
//       const txTime = new Date(txnDate);
//       const now = new Date();
//       const diffHours =
//         (now - txTime) / (1000 * 60 * 60);

//       if (diffHours > 24) {
//         return res.json({
//           success: false,
//           message: "Transaction is older than 24 hours",
//         });
//       }
//     }

//     if (
//       status === "TXN_SUCCESS" &&
//       txnAmount === Number(amount)
//     ) {
//       // Wallet add
//       await db.query(
//         `UPDATE users
//          SET wallet_credits = wallet_credits + ?
//          WHERE id = ?`,
//         [amount, userId]
//       );

//       // Deposit transaction
//       await db.query(
//         `INSERT INTO transactions
//         (
//           order_id,
//           user_id,
//           amount,
//           credits_added,
//           utr_number,
//           status,
//           type
//         )
//         VALUES (?, ?, ?, ?, ?, ?, ?)`,
//         [
//           paytmOrderId,
//           userId,
//           amount,
//           amount,
//           paytmOrderId,
//           "success",
//           "deposit",
//         ]
//       );

//       // Referral
//       const earnByRefer =
//         (Number(amount) * refer_percent) / 100;

//       if (earnByRefer >= 1 && referred_by) {
//         const [refUsers] = await db.query(
//           `SELECT *
//            FROM users
//            WHERE referral_code = ?
//            LIMIT 1`,
//           [referred_by]
//         );

//         if (refUsers.length) {
//           await db.query(
//             `UPDATE users
//              SET wallet_credits = wallet_credits + ?
//              WHERE id = ?`,
//             [earnByRefer, refUsers[0].id]
//           );

//           await db.query(
//             `INSERT INTO transactions
//             (
//               order_id,
//               user_id,
//               amount,
//               credits_added,
//               utr_number,
//               status,
//               type
//             )
//             VALUES (?, ?, ?, ?, ?, ?, ?)`,
//             [
//               paytmOrderId + "-REF",
//               refUsers[0].id,
//               earnByRefer,
//               earnByRefer,
//               paytmOrderId + "-REF",
//               "success",
//               "referral",
//             ]
//           );
//         }
//       }

//       return res.json({
//         success: true,
//         message: "Payment verified successfully",
//       });
//     }

//     if (status === "TXN_FAILURE") {
//       return res.json({
//         success: false,
//         message:
//           result?.resultInfo?.resultMsg ||
//           "Transaction failed",
//       });
//     }

//     return res.json({
//       success: false,
//       message: "Order verification failed",
//     });

//   } catch (err) {
//     console.log("FINAL ERROR:", err);

//     return res.json({
//       success: false,
//       message: err.message || "Verification error",
//     });
//   }
// };