const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Ye khulega: http://domain.com/admin/login
router.get('/login', (req, res) => {
    res.render('admin/login');
});

// Login handle karega: POST http://domain.com/admin/login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin@123') { 
        req.session.admin = { user: 'admin' };
        res.redirect('/admin/dashboard'); // Prefix ke saath redirect
    } else {
        res.send("<script>alert('Invalid Credentials'); window.location.href='/admin/login';</script>");
    }
});

// Dashboard: http://domain.com/admin/dashboard
router.get('/dashboard', (req, res, next) => {
    if(!req.session.admin) return res.redirect('/admin/login');
    next();
}, adminController.getDashboard);

router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);
router.get('/prompts', adminController.getPrompts);
router.post('/add-prompt', adminController.postAddPrompt);

module.exports = router;