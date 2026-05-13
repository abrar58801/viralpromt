const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Landing Page Route
router.get('/', async (req, res) => {
    try {
        // Fetching prompts for landing page (is_landing_page = 1)
        const [prompts] = await db.query('SELECT * FROM prompts WHERE is_landing_page = 1 ORDER BY created_at DESC');
        
        res.render('landing', { prompts, user: req.session.user || null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Register Page
router.get('/register', (req, res) => {
    res.render('register', { error: null });
});

module.exports = router;