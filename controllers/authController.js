const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.loginPage = async (req, res) => {
    res.render('login', { error: null });
};

exports.registerPage = async (req, res) => {

    try {

        const ref = req.query.ref || '';

        res.render("register", {
            ref
        });

    } catch (err) {

        console.log(err);

        res.redirect('/');
    }
};

exports.register = async (req, res) => {
    const { full_name, email, mobile, city, password, referred_by } = req.body;
    try {
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existing.length > 0) return res.send("Email already registered!");

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate Referral Code (Simple)
        const refCode = 'VP' + Math.floor(1000 + Math.random() * 9000);

        await db.query(
            'INSERT INTO users (full_name, email, mobile, city, password, plain_password, referral_code, referred_by, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, mobile, city, hashedPassword, password, refCode, referred_by, 0]
        );

        res.redirect('/login');
    } catch (err) {
        console.error(err);
        res.status(500).send("Registration Failed");
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND status = 1 AND type != 1', [email]);
        if (users.length === 0) return res.send("User not found!");

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (isMatch) {
            req.session.user = user;
            res.redirect('/dashboard');
        } else {
            res.send("Invalid Password!");
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Login Error");
    }
};

exports.logout = async (req, res) => {
 req.session.destroy(() => {
        res.redirect('/');
    });
};

exports.getChangePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const [users] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [req.session.user.id]
    );

    const user = users[0];

    if (!user) {
      return res.redirect("/login");
    }

    res.render("change-password", {
      user
    });

  } catch (err) {
    console.log(err);
    res.status(500).send("Page Error");
  }
};


exports.postChangePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const {
      current_password,
      new_password,
      confirm_password
    } = req.body;

    if (new_password !== confirm_password) {
      return res.send(`
        <script>
          alert('Passwords do not match');
          window.location.href='/change-password';
        </script>
      `);
    }

    const [users] = await db.query(
      `SELECT * FROM users WHERE id = ?`,
      [req.session.user.id]
    );

    if (!users.length) {
      return res.redirect("/login");
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(
      current_password,
      user.password
    );

    if (!isMatch) {
      return res.send(`
        <script>
          alert('Current password is incorrect');
          window.location.href='/change-password';
        </script>
      `);
    }

    const hashedPassword = await bcrypt.hash(
      new_password,
      10
    );

    await db.query(
      `UPDATE users
       SET password = ?,
       plain_password = ?
       WHERE id = ?`,
      [
        hashedPassword,
        new_password,
        user.id
      ]
    );

    return res.send(`
      <script>
        alert('Password changed successfully');
        window.location.href='/dashboard';
      </script>
    `);

  } catch (err) {
    console.log(err);
    res.status(500).send("Password Change Error");
  }
};