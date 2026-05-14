const db = require("../config/db");
const upload = require("../config/multer");
const bcrypt = require("bcryptjs");

// --- 1. Admin Dashboard Stats ---
exports.loginPage = async (req, res) => {
  res.render("admin/login");
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  const email = username;

  try {
    // Find Admin
    const [users] = await db.query(
      `SELECT * FROM users 
             WHERE email = ? 
             AND type = 1 AND status = 1`,
      [email],
    );

    // User Not Found
    if (users.length === 0) {
      return res.send(`
                <script>
                    alert('Admin not found');
                    window.location.href='/admin/login';
                </script>
            `);
    }

    // Password Check
    const isMatch = await bcrypt.compare(password, users[0].password);

    if (!isMatch) {
      return res.send(`
                <script>
                    alert('Wrong password');
                    window.location.href='/admin/login';
                </script>
            `);
    }

    // Admin Session
    req.session.admin = users[0];

    // Redirect
    return res.redirect("/admin/dashboard");
  } catch (err) {
    console.log(err);

    return res.status(500).send(`
            <script>
                alert('Login Error');
                window.location.href='/admin/login';
            </script>
        `);
  }
};

exports.logout = async (req, res) => {
  req.session.destroy(() => {
    res.redirect("/admin");
  });
};

exports.getDashboard = async (req, res) => {
  try {
    // =========================
    // USERS
    // =========================

    const [todayRegister] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM users
                WHERE DATE(created_at) = CURDATE()
                `,
    );

    const [totalRegister] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM users
                `,
    );

    // =========================
    // DEPOSIT
    // =========================

    const [todayDeposit] = await db.query(
      `
                SELECT SUM(amount) as total
                FROM transactions

                WHERE
                status = 'success'

                AND
                type = 'deposit'

                AND
                DATE(created_at) = CURDATE()
                `,
    );

    const [totalDeposit] = await db.query(
      `
                SELECT SUM(amount) as total
                FROM transactions

                WHERE
                status = 'success'

                AND
                type = 'deposit'
                `,
    );

    // =========================
    // UNLOCKS
    // =========================

    const [todayUnlock] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM unlocks

                WHERE
                DATE(unlocked_at) = CURDATE()
                `,
    );

    const [totalUnlock] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM unlocks
                `,
    );

    // =========================
    // CREDIT
    // =========================

    const [availableCredit] = await db.query(
      `
                SELECT
                SUM(wallet_credits)
                as total

                FROM users
                `,
    );

    const [usedCredit] = await db.query(
      `
                SELECT
                SUM(price_credits)
                as total

                FROM unlocks u

                JOIN prompts p
                ON u.prompt_id = p.id
                `,
    );

    // =========================
    // PROMPTS
    // =========================

    const [totalPrompts] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM prompts
                `,
    );

    // =========================
    // PENDING PAYMENT
    // =========================

    const [pendingPayments] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM transactions
                WHERE status = 'pending' AND type = 'deposit'
                `,
    );

    // =========================
    // CONTACT
    // =========================

    const [totalMessages] = await db.query(
      `
                SELECT COUNT(*) as total
                FROM contact_messages
                `,
    );

    const [todayWithdrawRows] = await db.query(
      `SELECT SUM(amount) as total
   FROM transactions
   WHERE type = 'withdraw'
   AND status = 'success'
   AND DATE(created_at) = CURDATE()`,
    );

    const [totalWithdrawRows] = await db.query(
      `SELECT SUM(amount) as total
   FROM transactions
   WHERE type = 'withdraw'
   AND status = 'success'`,
    );

    const [pendingWithdrawRows] = await db.query(
      `SELECT COUNT(*) as total
   FROM transactions
   WHERE type = 'withdraw'
   AND status = 'pending'`,
    );

    // =========================
    // RENDER
    // =========================

    res.render("admin/dashboard", {
      todayRegister: todayRegister[0].total || 0,

      totalRegister: totalRegister[0].total || 0,

      todayDeposit: todayDeposit[0].total || 0,

      totalDeposit: totalDeposit[0].total || 0,

      todayUnlock: todayUnlock[0].total || 0,

      totalUnlock: totalUnlock[0].total || 0,

      availableCredit: availableCredit[0].total || 0,

      usedCredit: usedCredit[0].total || 0,

      totalPrompts: totalPrompts[0].total || 0,

      pendingPayments: pendingPayments[0].total || 0,

      totalMessages: totalMessages[0].total || 0,

      todayWithdraw: todayWithdrawRows[0].total || 0,
      totalWithdraw: totalWithdrawRows[0].total || 0,
      pendingWithdraw: pendingWithdrawRows[0].total || 0,

      admin: req.session.admin,
    });
  } catch (err) {
    console.log(err);

    return res.status(500).send("Admin Dashboard Error");
  }
};

// --- 2. Prompts Management (List) ---
exports.getPrompts = async (req, res) => {
  try {
    const [prompts] = await db.query("SELECT * FROM prompts ORDER BY id DESC");
    res.render("admin/prompts", { prompts });
  } catch (err) {
    res.status(500).send("Error fetching prompts");
  }
};

// --- 3. Add New Prompt (With File Upload) ---
exports.postAddPrompt = (req, res) => {
  upload(
    req,
    res,

    async (err) => {
      // Upload Error
      if (err) {
        console.error("Multer Error:", err);

        return res.send("Upload Error: " + err.message);
      }

      try {
        const {
          title,
          description,
          category,
          price_credits,
          type,
          views,
          media_type,
          before_video,
          after_video,
          how_to_use,
        } = req.body;

        // Default Values
        let before_image = null;
        let after_image = null;
        let finalBeforeVideo = null;
        let finalAfterVideo = null;

        // IMAGE PROMPT
        if (type === "image") {
          if (
            !req.files ||
            !req.files["before_image"] ||
            !req.files["after_image"]
          ) {
            return res.send("Both images required.");
          }

          before_image = req.files["before_image"][0].filename;
          after_image = req.files["after_image"][0].filename;
        }

        // VIDEO + IMAGE
        if (type === "video" && media_type === "image") {
          if (!req.files || !req.files["before_image"]) {
            return res.send("Before image required.");
          }

          if (!after_video) {
            return res.send("After video URL required.");
          }

          before_image = req.files["before_image"][0].filename;
          finalAfterVideo = after_video;
        }

        // VIDEO + VIDEO
        if (type === "video" && media_type === "video") {
          if (!before_video || !after_video) {
            return res.send("Both video URLs required.");
          }

          finalBeforeVideo = before_video;
          finalAfterVideo = after_video;
        }

        // =========================
        // INSERT
        // =========================

        const sql = `
                INSERT INTO prompts (

                    title,
                    description,
                    category,
                    before_image,
                    after_image,
                    before_video,
                    after_video,
                    price_credits,
                    type,
                    fake_views,
                    how_to_use,
                    media_type

                )

                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

        await db.query(sql, [
          title,
          description,
          category,
          before_image,
          after_image,
          finalBeforeVideo,
          finalAfterVideo,
          price_credits,
          type,
          views,
          how_to_use,
          media_type || "image",
        ]);

        // Success
        return res.redirect("/admin/prompts");
      } catch (dbErr) {
        console.error("DB Insert Error:", dbErr);

        return res.status(500).send("Database Error: " + dbErr.message);
      }
    },
  );
};

// --- 4. Update Prompt ---
exports.updatePrompt = (req, res) => {
  upload(
    req,
    res,

    async (err) => {
      // Upload Error
      if (err) {
        console.log(err);

        return res.send("Upload Error");
      }

      try {
        const {
          title,
          description,
          price_credits,
          type,
          views,
          before_video,
          after_video,
          how_to_use,
          category,
          media_type,
        } = req.body;

        // =========================
        // OLD PROMPT
        // =========================

        const [oldPrompt] = await db.query(
          `
                    SELECT *
                    FROM prompts
                    WHERE id = ?
                    `,
          [req.params.id],
        );

        // Not Found
        if (oldPrompt.length === 0) {
          return res.redirect("/admin/prompts");
        }

        // =========================
        // DEFAULT VALUES
        // =========================

        let before_image = oldPrompt[0].before_image;
        let after_image = oldPrompt[0].after_image;
        let finalBeforeVideo = oldPrompt[0].before_video;
        let finalAfterVideo = oldPrompt[0].after_video;

        // IMAGE
        if (type === "image") {
          if (req.files && req.files["before_image"]) {
            before_image = req.files["before_image"][0].filename;
          }

          if (req.files && req.files["after_image"]) {
            after_image = req.files["after_image"][0].filename;
          }

          finalBeforeVideo = null;
          finalAfterVideo = null;
        }

        // VIDEO + IMAGE
        if (type === "video" && media_type === "image") {
          if (req.files && req.files["before_image"]) {
            before_image = req.files["before_image"][0].filename;
          }

          after_image = null;
          finalBeforeVideo = null;
          finalAfterVideo = after_video || oldPrompt[0].after_video;
        }

        // VIDEO + VIDEO
        if (type === "video" && media_type === "video") {
          before_image = null;
          after_image = null;

          finalBeforeVideo = before_video || oldPrompt[0].before_video;
          finalAfterVideo = after_video || oldPrompt[0].after_video;
        }

        // =========================
        // UPDATE
        // =========================

        await db.query(
          `
                UPDATE prompts
                SET

                    title = ?,
                    description = ?,
                    before_image = ?,
                    after_image = ?,
                    before_video = ?,
                    after_video = ?,
                    price_credits = ?,
                    type = ?,
                    fake_views = ?,
                    how_to_use = ?,
                    category = ?,
                    media_type = ?

                WHERE id = ?
                `,
          [
            title,
            description,
            before_image,
            after_image,
            finalBeforeVideo,
            finalAfterVideo,
            price_credits,
            type,
            views,
            how_to_use,
            category,
            media_type || "image",
            req.params.id,
          ],
        );

        return res.redirect("/admin/prompts");
      } catch (err) {
        console.log(err);

        return res.status(500).send("Update Error");
      }
    },
  );
};

// --- 5. Edit Prompt Page ---
exports.editPromptPage = async (req, res) => {
  try {
    const [prompts] = await db.query(`SELECT * FROM prompts WHERE id = ?`, [
      req.params.id,
    ]);

    const [categories] = await db.query(
      `SELECT * FROM categories WHERE status = 1 ORDER BY id DESC`,
    );

    if (!prompts.length) {
      return res.redirect("/admin/prompts");
    }

    res.render("admin/edit-prompt", {
      prompt: prompts[0],
      categories,
    });
  } catch (err) {
    console.log(err);
    res.send("Edit Prompt Error");
  }
};

// --- 6. Delete Prompt ---
exports.deletePrompt = async (req, res) => {
  try {
    const promptId = req.params.id;

    // Delete Unlocks First
    await db.query(
      `DELETE FROM unlocks
             WHERE prompt_id = ?`,
      [promptId],
    );

    // Delete Prompt
    await db.query(
      `DELETE FROM prompts
             WHERE id = ?`,
      [promptId],
    );

    return res.redirect("/admin/prompts");
  } catch (err) {
    console.log(err);

    res.status(500).send("Delete Error");
  }
};

// Add Prompt Page
exports.addPromptPage = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT * FROM categories WHERE status = 1 ORDER BY id DESC`,
    );

    res.render("admin/add-prompt", {
      categories,
    });
  } catch (err) {
    console.log(err);
    res.send("Add Prompt Page Error");
  }
};

// Prompt List
exports.getPrompts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 10;

    const offset = (page - 1) * limit;

    const search = req.query.search || "";

    // Count Query
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
                 FROM prompts
                 WHERE title LIKE ?`,
      [`%${search}%`],
    );

    const totalPrompts = countRows[0].total;

    const totalPages = Math.ceil(totalPrompts / limit);

    // Prompts
    const [prompts] = await db.query(
      `SELECT prompts.*, categories.name as category
                 FROM prompts
                 LEFT JOIN categories ON categories.id = prompts.category
                 WHERE prompts.title LIKE ?
                 ORDER BY prompts.id DESC
                 LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset],
    );

    res.render("admin/prompts", {
      prompts,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (err) {
    console.log(err);

    res.send("Prompt Page Error");
  }
};

// ======================
// Manage Users
// ======================

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 10;

    const offset = (page - 1) * limit;

    const search = req.query.search || "";

    // Count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
                 FROM users
                 WHERE full_name LIKE ? AND type != 1`,
      [`%${search}%`],
    );

    const totalUsers = countRows[0].total;

    const totalPages = Math.ceil(totalUsers / limit);

    // Users
    const [users] = await db.query(
      `SELECT *
                 FROM users
                 WHERE full_name LIKE ? AND type != 1
                 ORDER BY id DESC
                 LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset],
    );

    res.render("admin/users", {
      users,

      currentPage: page,

      totalPages,

      search,
    });
  } catch (err) {
    console.log(err);

    res.send("Users Page Error");
  }
};

// ======================
// Transactions
// ======================

exports.getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const limit = 10;

    const offset = (page - 1) * limit;

    // Count
    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
                 FROM transactions`,
    );

    const totalTransactions = countRows[0].total;

    const totalPages = Math.ceil(totalTransactions / limit);

    // Transactions
    const [transactions] = await db.query(
      `SELECT t.*, u.full_name
                 FROM transactions t
                 LEFT JOIN users u
                 ON u.id = t.user_id
                 ORDER BY t.id DESC
                 LIMIT ? OFFSET ?`,
      [limit, offset],
    );

    res.render("admin/transactions", {
      transactions,

      currentPage: page,

      totalPages,
    });
  } catch (err) {
    console.log(err);

    res.send("Transactions Error");
  }
};

// ======================
// Contact Messages
// ======================

exports.getContactMessages = async (req, res) => {
  try {
    const [messages] = await db.query(
      `SELECT *
                 FROM contact_messages
                 ORDER BY id DESC`,
    );

    res.render("admin/contact-messages", {
      messages,
    });
  } catch (err) {
    console.log(err);

    res.send("Messages Error");
  }
};

exports.getSettings = async (req, res) => {
  try {
    const [settings] = await db.query(
      "SELECT * FROM site_settings WHERE id = 1",
    );
    res.render("admin/settings", { settings: settings[0] || {} });
  } catch (err) {
    res.status(500).send("Settings Error");
  }
};

exports.updateSettings = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);

      return res.send("Upload Error: " + err.message);
    }

    try {
      const {
        site_title,
        site_description,
        seo_tags,

        contact_email,
        contact_call,

        whatsapp_link,
        telegram_link,

        apk_url,
        min_deposit,

        paytm_mid,
        paytm_mkey,

        notification_title,
        notification_status,
        notification_text,

        refer_percent,
        how_to_use,
        bharatpe_mid,
        bharatpe_token,
      } = req.body;

      // OLD SETTINGS
      const [oldSettings] = await db.query(
        `
                    SELECT *
                    FROM site_settings
                    WHERE id = 1
                    `,
      );

      // FILES
      let header_logo = oldSettings[0].header_logo;

      let paytm_qr = oldSettings[0].paytm_qr;

      // New Logo
      if (req.files && req.files["header_logo"]) {
        header_logo = req.files["header_logo"][0].filename;
      }

      // New QR
      if (req.files && req.files["paytm_qr"]) {
        paytm_qr = req.files["paytm_qr"][0].filename;
      }

      // UPDATE
      await db.query(
        `
                UPDATE site_settings
                SET

                    site_title = ?,
                    site_description = ?,
                    seo_tags = ?,

                    contact_email = ?,
                    contact_call = ?,

                    whatsapp_link = ?,
                    telegram_link = ?,

                    apk_url = ?,
                    min_deposit = ?,

                    paytm_mid = ?,
                    paytm_mkey = ?,

                    notification_title = ?,
                    notification_text = ?,
                    notification_status = ?,

                    header_logo = ?,
                    paytm_qr = ?,
                    refer_percent = ?,
                    how_to_use = ?,
                    bharatpe_mid = ?,
                    bharatpe_token = ?

                WHERE id = 1
                `,
        [
          site_title,
          site_description,
          seo_tags,

          contact_email,
          contact_call,

          whatsapp_link,
          telegram_link,

          apk_url,
          min_deposit,

          paytm_mid,
          paytm_mkey,

          notification_title,
          notification_text,
          notification_status ? 1 : 0,

          header_logo,
          paytm_qr,
          refer_percent,
          how_to_use,
          bharatpe_mid,
          bharatpe_token,
        ],
      );

      return res.redirect("/admin/settings");
    } catch (dbErr) {
      console.log(dbErr);

      return res.status(500).send("Database Error: " + dbErr.message);
    }
  });
};

exports.updateWallet = async (req, res) => {
  try {
    const { user_id, amount, action_type } = req.body;

    const updateAmount = Number(amount);

    if (!updateAmount || updateAmount <= 0) {
      return res.redirect("/admin/users");
    }

    const [users] = await db.query(
      `SELECT *
       FROM users
       WHERE id = ?`,
      [user_id],
    );

    if (!users.length) {
      return res.redirect("/admin/users");
    }

    const user = users[0];

    let currentWallet = Number(user.wallet_credits || 0);
    let finalWallet = currentWallet;
    let remainingWallet = 0;

    // Add / Deduct
    if (action_type === "deduct") {
      finalWallet = currentWallet - updateAmount;

      if (finalWallet < 0) {
        finalWallet = 0;
      }
      
    } else {
      finalWallet = currentWallet + updateAmount;
      remainingWallet = amount;
    }

    // Update wallet
    await db.query(
      `UPDATE users
       SET wallet_credits = ?, remaining_wallet = remaining_wallet + ?
       WHERE id = ?`,
      [finalWallet, remainingWallet, user_id],
    );

    // Transaction history
    const orderId = "ADMIN" + Date.now();

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
      [
        orderId,
        user_id,
        updateAmount,
        updateAmount,
        "ADMIN-" + action_type.toUpperCase(),
        "success",
        action_type === "deduct" ? "withdraw" : "deposit",
      ],
    );

    return res.redirect("/admin/users");
  } catch (err) {
    console.log(err);

    return res.send("Wallet Update Error");
  }
};

exports.getWithdrawals = async (req, res) => {
  try {
    const [withdrawals] = await db.query(`
      SELECT
        transactions.*,
        users.full_name,
        users.mobile,
        users.email,
        users.upi_id
      FROM transactions
      LEFT JOIN users
        ON users.id = transactions.user_id
      WHERE transactions.type = 'withdraw' AND transactions.status = 'pending'
      ORDER BY transactions.id DESC
    `);

    res.render("admin/withdrawals", {
      withdrawals,
      admin: req.session.admin,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Withdraw Page Error");
  }
};

exports.withdrawAction = async (req, res) => {
  try {
    const { id, action } = req.body;

    const [rows] = await db.query(
      `SELECT *
       FROM transactions
       WHERE id = ?`,
      [id],
    );

    if (!rows.length) {
      return res.redirect("/admin/withdrawals");
    }

    const tx = rows[0];

    if (tx.status !== "pending") {
      return res.redirect("/admin/withdrawals");
    }

    // APPROVE
    if (action === "approve") {
      await db.query(
        `UPDATE transactions
         SET status = 'success'
         WHERE id = ?`,
        [id],
      );
    }

    // REJECT
    if (action === "reject") {
      await db.query(
        `UPDATE transactions
         SET status = 'failed'
         WHERE id = ?`,
        [id],
      );

      // refund wallet
      await db.query(
        `UPDATE users
         SET wallet_credits = wallet_credits + ?
         WHERE id = ?`,
        [tx.amount, tx.user_id],
      );
    }

    res.redirect("/admin/withdrawals");
  } catch (err) {
    console.log(err);
    res.status(500).send("Withdraw Action Error");
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { user_id, status } = req.body;

    await db.query(
      `UPDATE users
       SET status = ?
       WHERE id = ?`,
      [status, user_id],
    );

    return res.redirect("/admin/users");
  } catch (err) {
    console.log(err);
    return res.send("Status Update Error");
  }
};

exports.getChangePassword = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    res.render("admin/change-password", {
      admin: req.session.admin,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Page Error");
  }
};

exports.postChangePassword = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }

    const { current_password, new_password, confirm_password } = req.body;

    if (new_password !== confirm_password) {
      return res.send(`
        <script>
          alert('Passwords do not match');
          window.location.href='/admin/change-password';
        </script>
      `);
    }

    const [admins] = await db.query(
      `SELECT *
       FROM users
       WHERE id = ?
       AND type = 1`,
      [req.session.admin.id],
    );

    if (!admins.length) {
      return res.redirect("/admin/login");
    }

    const admin = admins[0];

    const isMatch = await bcrypt.compare(current_password, admin.password);

    if (!isMatch) {
      return res.send(`
        <script>
          alert('Current password is incorrect');
          window.location.href='/admin/change-password';
        </script>
      `);
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);

    await db.query(
      `UPDATE users
       SET password = ?, 
       plain_password = ?
       WHERE id = ?`,
      [hashedPassword, new_password, admin.id],
    );

    return res.send(`
      <script>
        alert('Password changed successfully');
        window.location.href='/admin/dashboard';
      </script>
    `);
  } catch (err) {
    console.log(err);
    res.status(500).send("Password Change Error");
  }
};

// Add Category Page
exports.addCategoryPage = (req, res) => {
  res.render("admin/add-category");
};

// Category List
exports.getCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const [countRows] = await db.query(
      `SELECT COUNT(*) as total
       FROM categories
       WHERE name LIKE ?`,
      [`%${search}%`],
    );

    const totalCategories = countRows[0].total;
    const totalPages = Math.ceil(totalCategories / limit);

    const [categories] = await db.query(
      `SELECT *
       FROM categories
       WHERE name LIKE ?
       ORDER BY id DESC
       LIMIT ? OFFSET ?`,
      [`%${search}%`, limit, offset],
    );

    res.render("admin/categories", {
      categories,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (err) {
    console.log(err);
    res.send("Category Page Error");
  }
};

// Add Category
exports.postAddCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    if (!name) {
      return res.send("Category name required");
    }

    await db.query(
      `INSERT INTO categories (name, status)
       VALUES (?, ?)`,
      [name, status || 1],
    );

    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
    res.send("Add Category Error");
  }
};

// Edit Category Page
exports.editCategoryPage = async (req, res) => {
  try {
    const [categories] = await db.query(
      `SELECT * FROM categories WHERE id = ?`,
      [req.params.id],
    );

    if (!categories.length) {
      return res.redirect("/admin/categories");
    }

    res.render("admin/edit-category", {
      category: categories[0],
    });
  } catch (err) {
    console.log(err);
    res.send("Edit Category Error");
  }
};

// Update Category
exports.updateCategory = async (req, res) => {
  try {
    const { name, status } = req.body;

    await db.query(
      `UPDATE categories
       SET name = ?, status = ?
       WHERE id = ?`,
      [name, status, req.params.id],
    );

    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
    res.send("Update Category Error");
  }
};

// Delete Category
exports.deleteCategory = async (req, res) => {
  try {
    await db.query(`DELETE FROM categories WHERE id = ?`, [req.params.id]);

    res.redirect("/admin/categories");
  } catch (err) {
    console.log(err);
    res.send("Delete Category Error");
  }
};
