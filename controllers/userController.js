const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getLogin = (req, res) => res.render("login");
exports.getRegister = (req, res) => res.render("register");

exports.postLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) return res.send("User not found");
    const isMatch = await bcrypt.compare(password, users[0].password);
    if (!isMatch) return res.send("Wrong password");
    req.session.user = users[0];
    res.redirect("/dashboard");
  } catch (err) {
    res.status(500).send("Login Error");
  }
};

exports.postRegister = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO users (name, email, password, credits) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, 50],
    );
    res.redirect("/login");
  } catch (err) {
    res.status(500).send("Registration Failed");
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/login");
};

exports.getDashboard = async (req, res) => {
  try {
    // Current Page
    const page = parseInt(req.query.page) || 1;

    // Prompt Type
    const type = req.query.type || "image";

    // Per Page Limit
    const limit = 6;

    // Offset
    const offset = (page - 1) * limit;

    const userId = req.session.user.id;

    // Total Prompts Count
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM prompts
      WHERE type = ?
      `,
      [type],
    );

    const totalPrompts = countRows[0].total;
    const totalPages = Math.ceil(totalPrompts / limit);

    // Prompts + unlock status
    const [prompts] = await db.query(
      `
      SELECT
        p.*,
        CASE
          WHEN u.id IS NOT NULL THEN 1
          ELSE 0
        END AS is_unlocked
      FROM prompts p
      LEFT JOIN unlocks u
        ON u.prompt_id = p.id
        AND u.user_id = ?
      WHERE p.type = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [userId, type, limit, offset],
    );

    // User Data
    const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
      userId,
    ]);

    res.render("dashboard", {
      prompts,
      user: userData[0],
      currentType: type,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Dashboard Error");
  }
};

exports.getPromptDetail = async (req, res) => {
  try {
    const [prompt] = await db.query("SELECT * FROM prompts WHERE id = ?", [
      req.params.id,
    ]);
    const [unlocked] = await db.query(
      "SELECT * FROM unlocks WHERE user_id = ? AND prompt_id = ?",
      [req.session.user.id, req.params.id],
    );
    res.render("prompt-detail", {
      prompt: prompt[0],
      isUnlocked: unlocked.length > 0,
      user: req.session.user,
    });
  } catch (err) {
    res.status(500).send("Prompt Load Error");
  }
};

exports.getPromptList = async (req, res) => {
  try {
    if (!req.session.user.id) {
      res.status(500).send("login required!");
    }

    const [unlocked] = await db.query(
      "SELECT * FROM unlocks WHERE user_id = ?",
      [req.session.user.id],
    );

    if (unlocked.length === 0) {
      res.status(500).send("Unlocked not available!");
    }

    const promptId = unlocked[0].prompt_id;

    const [prompt] = await db.query("SELECT * FROM prompts WHERE id = ?", [
      promptId,
    ]);

    res.render("prompt-list", {
      prompt: prompt[0],
      isUnlocked: unlocked.length > 0,
      user: req.session.user,
    });
  } catch (err) {
    res.status(500).send("Prompt Load Error");
  }
};

exports.postUnlockPrompt = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { prompt_id } = req.body;

    if (!prompt_id) {
      return res.json({
        success: false,
        message: "Invalid Prompt",
      });
    }

    await connection.beginTransaction();

    // Get Prompt
    const [promptRows] = await connection.query(
      "SELECT * FROM prompts WHERE id = ? LIMIT 1",
      [prompt_id],
    );

    if (!promptRows.length) {
      await connection.rollback();

      return res.json({
        success: false,
        message: "Prompt not found",
      });
    }

    const prompt = promptRows[0];

    // Get User
    const [userRows] = await connection.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [req.session.user.id],
    );

    const user = userRows[0];

    // Already unlocked check
    const [alreadyUnlocked] = await connection.query(
      `SELECT id FROM unlocks
             WHERE user_id = ? AND prompt_id = ?`,
      [user.id, prompt_id],
    );

    if (alreadyUnlocked.length) {
      await connection.rollback();

      return res.json({
        success: false,
        message: "Already unlocked",
      });
    }

    // Balance Check
    if (user.wallet_credits < prompt.price_credits) {
      await connection.rollback();

      return res.json({
        success: false,
        message: "Low Balance",
      });
    }

    // Deduct Credits
    await connection.query(
      `UPDATE users
             SET wallet_credits = wallet_credits - ?
             WHERE id = ?`,
      [prompt.price_credits, user.id],
    );

    // Insert Unlock
    await connection.query(
      `INSERT INTO unlocks
             (user_id, prompt_id)
             VALUES (?, ?)`,
      [user.id, prompt_id],
    );

    await connection.commit();

    return res.json({
      success: true,
      redirect: `/prompt/${prompt_id}`,
    });
  } catch (err) {
    await connection.rollback();

    console.log(err);

    return res.status(500).json({
      success: false,
      message: "Unlock Failed",
    });
  } finally {
    connection.release();
  }
};

exports.getAddFund = async (req, res) => {
  try {
    // Settings
    const [site_settings] = await db.query(
      `
                SELECT *
                FROM site_settings

                ORDER BY id DESC
                LIMIT 1
                `,
    );

    // Render
    return res.render("add-fund", {
      user: req.session.user,

      settings: site_settings[0] || {},
    });
  } catch (err) {
    console.log(err);

    return res.status(500).send("Add Fund Page Error");
  }
};

exports.getReferEarn = async (req, res) => {
  try {
    // Settings
    const [settingsRows] = await db.query(`
      SELECT *
      FROM site_settings
      ORDER BY id DESC
      LIMIT 1
    `);

    const settings = settingsRows[0] || {};

    let user = null;
    let totalReferrals = 0;
    let todayReferrals = 0;
    let earnedCredits = 0;
    let referralRank = "Bronze";
    let referrals = [];

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    let totalPages = 1;

    if (req.session.user) {
      // User
      const [userRows] = await db.query(`
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
      `, [req.session.user.id]);

      user = userRows[0] || null;

      if (user) {
        // Total referrals
        const [totalReferralRows] = await db.query(`
          SELECT COUNT(*) as total
          FROM users
          WHERE referred_by = ?
        `, [user.referral_code]);

        totalReferrals = totalReferralRows[0].total || 0;

        // Today's referrals
        const [todayReferralRows] = await db.query(`
          SELECT COUNT(*) as total
          FROM users
          WHERE referred_by = ?
          AND DATE(created_at) = CURDATE()
        `, [user.referral_code]);

        todayReferrals = todayReferralRows[0].total || 0;

        // REAL earned credits
        const [earnedRows] = await db.query(`
          SELECT SUM(amount) as total
          FROM transactions
          WHERE user_id = ?
          AND type = 'referral'
          AND status = 'success'
        `, [user.id]);

        earnedCredits = earnedRows[0].total || 0;

        // Count referral history
        const [countRows] = await db.query(`
          SELECT COUNT(*) as total
          FROM transactions
          WHERE user_id = ?
          AND type = 'referral'
          AND status = 'success'
        `, [user.id]);

        totalPages = Math.ceil(countRows[0].total / limit);

        // Real referral history
        const [referralRows] = await db.query(`
          SELECT
            t.amount,
            t.created_at,
            u.full_name,
            u.email
          FROM transactions t
          LEFT JOIN users u
            ON u.referral_code = ?
          WHERE t.user_id = ?
          AND t.type = 'referral'
          AND t.status = 'success'
          ORDER BY t.id DESC
          LIMIT ? OFFSET ?
        `, [
          user.referral_code,
          user.id,
          limit,
          offset
        ]);

        referrals = referralRows || [];

        // Rank
        if (totalReferrals >= 50) {
          referralRank = "Diamond";
        } else if (totalReferrals >= 20) {
          referralRank = "Gold";
        } else if (totalReferrals >= 10) {
          referralRank = "Silver";
        }
      }
    }

    return res.render("refer-earn", {
      user,
      settings,
      totalReferrals,
      earnedCredits,
      todayReferrals,
      referralRank,
      referrals,
      currentPage: page,
      totalPages,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).send("Refer Earn Page Error");
  }
};

exports.getMyUnlocks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // Prompt Type
    const type = req.query.type || "image";

    const limit = 6;

    const offset = (page - 1) * limit;

    // User
    const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
      req.session.user.id,
    ]);

    // Total Count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
             FROM unlocks
             WHERE user_id = ?`,
      [req.session.user.id],
    );

    const totalPrompts = countRows[0].total;

    const totalPages = Math.ceil(totalPrompts / limit);

    // Unlocked Prompts
    const [prompts] = await db.query(
      `SELECT p.*
             FROM unlocks u
             JOIN prompts p ON p.id = u.prompt_id
             WHERE u.user_id = ? AND p.type = ?
             ORDER BY u.id DESC
             LIMIT ? OFFSET ?`,
      [req.session.user.id, type, limit, offset],
    );

    res.render("my-unlocks", {
      prompts,
      currentType: type,
      currentPage: page,
      totalPages,
      user: userData[0],
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("My Unlocks Error");
  }
};

exports.landingPage = async (req, res) => {
  try {
    // Prompt Type
    const type = req.query.type || "image";

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    // User
    let user = null;
    let userId = 0;

    if (req.session.user) {
      const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.session.user.id,
      ]);

      user = userData[0] || null;

      if (user) {
        userId = user.id;
      }
    }

    // Total Count
    const [countRows] = await db.query(
      `
      SELECT COUNT(*) as total
      FROM prompts
      WHERE type = ?
      `,
      [type],
    );

    const totalPrompts = countRows[0].total;
    const totalPages = Math.ceil(totalPrompts / limit);

    // Prompts + unlock status
    const [prompts] = await db.query(
      `
      SELECT
        p.*,
        CASE
          WHEN u.id IS NOT NULL THEN 1
          ELSE 0
        END AS is_unlocked
      FROM prompts p
      LEFT JOIN unlocks u
        ON u.prompt_id = p.id
        AND u.user_id = ?
      WHERE p.type = ?
      ORDER BY p.id DESC
      LIMIT ? OFFSET ?
      `,
      [userId, type, limit, offset],
    );

    // Settings
    const [settings] = await db.query(
      "SELECT * FROM site_settings ORDER BY id DESC LIMIT 1",
    );

    res.render("landing", {
      prompts,
      currentType: type,
      currentPage: page,
      totalPages,
      user,
      settings: settings[0] || null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Landing Page Error");
  }
};

exports.getSupport = async (req, res) => {
  try {
    let user = null;

    if (req.session.user) {
      const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.session.user.id,
      ]);

      user = userData[0] || null;
    }

    const [settings] = await db.query(
      "SELECT * FROM site_settings ORDER BY id DESC LIMIT 1",
    );

    res.render("support", {
      user,
      settings: settings[0] || null,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Support Page Error");
  }
};

exports.getAbout = async (req, res) => {
  try {
    let user = null;

    if (req.session.user) {
      const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.session.user.id,
      ]);

      user = userData[0] || null;
    }

    res.render("about", {
      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("About Page Error");
  }
};

exports.getContact = async (req, res) => {
  try {
    let user = null;

    // If Logged In
    if (req.session.user) {
      const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.session.user.id,
      ]);

      user = userData[0] || null;
    }

    res.render("contact", {
      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Contact Page Error");
  }
};

exports.getTerms = async (req, res) => {
  try {
    let user = null;

    if (req.session.user) {
      const [userData] = await db.query("SELECT * FROM users WHERE id = ?", [
        req.session.user.id,
      ]);

      user = userData[0] || null;
    }

    res.render("terms", {
      user,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Terms Page Error");
  }
};

exports.contactSubmit = async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !phone || !message) {
      return res.send(`
                <script>
                    alert("All fields are required");
                    window.history.back();
                </script>
            `);
    }

    // Save Into Database
    await db.query(
      `INSERT INTO contact_messages
            (name, email, phone, message)
            VALUES (?, ?, ?, ?)`,
      [name, email, phone, message],
    );

    return res.send(`
            <script>
                alert("Message sent successfully!");
                window.history.back();
            </script>
        `);
  } catch (err) {
    console.log(err);

    return res.status(500).send("Message Send Failed");
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const type = req.query.type || "all";

    // User
    const [userRows] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      req.session.user.id,
    ]);

    const user = userRows[0];

    if (!user) {
      return res.redirect("/login");
    }

    let whereClause = `WHERE user_id = ?`;
    let params = [user.id];

    // Filter
    if (type !== "all") {
      whereClause += ` AND type = ?`;
      params.push(type);
    }

    // Count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM transactions
       ${whereClause}`,
      params,
    );

    const totalTransactions = countRows[0].total || 0;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Transactions
    const [transactions] = await db.query(
      `SELECT *
       FROM transactions
       ${whereClause}
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    res.render("transaction", {
      user,
      transactions,
      totalTransactions,
      currentPage: page,
      totalPages,
      currentType: type,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Transaction Page Error");
  }
};

exports.getHowToUse = async (req, res) => {
  try {
    return res.render("how-to-use");
  } catch (err) {
    console.log(err);

    return res.status(500).send("Page Error");
  }
};

exports.getWithdraw = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const [users] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      req.session.user.id,
    ]);

    const user = users[0];

    res.render("withdraw", {
      user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Withdraw Page Error");
  }
};

exports.postWithdraw = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const { amount, upi_id } = req.body;

    const withdrawAmount = Number(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      return res.send("Invalid amount");
    }

    const [users] = await db.query(`SELECT * FROM users WHERE id = ?`, [
      req.session.user.id,
    ]);

    if (!users.length) {
      return res.redirect("/login");
    }

    const user = users[0];

    if (withdrawAmount > user.wallet_credits) {
      return res.send("Insufficient wallet balance");
    }

    const orderId = "WD" + Date.now();

    // Deduct Wallet
    await db.query(
      `UPDATE users
       SET wallet_credits = wallet_credits - ?, upi_id = ?
       WHERE id = ?`,
      [withdrawAmount, upi_id, user.id],
    );

    // Transaction
    await db.query(
      `INSERT INTO transactions
      (
        order_id,
        user_id,
        amount,
        credits_added,
        utr_number,
        status,
        type
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, user.id, withdrawAmount, 0, upi_id, "pending", "withdraw"],
    );

    return res.send(`
      <script>
        alert('Withdrawal request submitted successfully');
        window.location.href='/transactions';
      </script>
    `);
  } catch (err) {
    console.log(err);
    res.status(500).send("Withdraw Error");
  }
};
