const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// --- MIDDLEWARE: Sirf logged-in users hi access kar sakein ---
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.status(401).json({ success: false, message: "Unauthorized. Please login." });
};

/**
 * @Route   POST /verify-payment
 * @Desc    User ka UTR fetch karke Paytm API se verify karna
 * @Access  Private (Logged-in users only)
 */
router.post('/verify-payment', isAuthenticated, paymentController.verifyUTR);

module.exports = router;