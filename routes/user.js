const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const paymentController = require('../controllers/paymentController');

const isAuthenticated = (req, res, next) => {
    if (req.session.user) return next();
    res.redirect('/login');
};

// --- Open Routes (Bina Login ke khulenge) ---
router.get('/login', userController.getLogin);
router.post('/login', userController.postLogin);
router.get('/register', userController.getRegister);
router.post('/register', userController.postRegister);
router.get('/logout', userController.logout);

// --- Protected Routes (Sirf Login ke baad) ---
router.get('/dashboard', isAuthenticated, userController.getDashboard);
router.get('/prompt/:id', isAuthenticated, userController.getPromptDetail);
router.post('/unlock-prompt', isAuthenticated, userController.postUnlockPrompt);
router.get('/add-fund', isAuthenticated, userController.getAddFund);
router.post('/verify-payment', isAuthenticated, paymentController.verifyUTR);
router.get('/refer-earn', isAuthenticated, userController.getReferEarn);
router.get('/my-unlocks', isAuthenticated, userController.getMyUnlocks);

module.exports = router;