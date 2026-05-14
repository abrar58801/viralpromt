const express = require("express");
const router = express.Router();

const db = require("../config/db");

const adminController = require("../controllers/adminController");
const authController = require("../controllers/authController");
const paymentController = require("../controllers/paymentController");
const userController = require("../controllers/userController");

// ======================
// Middleware
// ======================

// User Auth Middleware
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.redirect("/login");
};

// Admin Auth Middleware
const isAdminAuthenticated = (req, res, next) => {
  if (req.session.admin) {
    return next();
  }
  return res.redirect("/admin/login");
};

const isGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  next();
};

const isAdminGuest = (req, res, next) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  next();
};

// ======================
// Landing Routes
// ======================

// Landing Page
router.get("/", userController.landingPage);

// ======================
// Auth Routes
// ======================
router.get("/login", isGuest, authController.loginPage);
router.get("/register", isGuest, authController.registerPage);

// API Auth
router.post("/register", isGuest, authController.register);
router.post("/login", isGuest, authController.login);
router.get("/auth/logout", authController.logout);
router.get("/logout", authController.logout);

// User Login/Register
router.get("/user/login", userController.getLogin);
router.post("/user/login", userController.postLogin);

router.get("/user/register", userController.getRegister);
router.post("/user/register", userController.postRegister);

// ======================
// User Protected Routes
// ======================

// Dashboard
router.get("/dashboard", isAuthenticated, userController.getDashboard);

router.get("/support", userController.getSupport);
router.get("/about", userController.getAbout);
router.get("/contact", userController.getContact);
router.get("/terms", userController.getTerms);
router.post("/contact-submit", userController.contactSubmit);

// Prompt Detail
router.get("/prompt/:id", isAuthenticated, userController.getPromptDetail);

router.get("/my-unlocks-list", isAuthenticated, userController.getMyUnlocks);

// Unlock Prompt
router.post("/unlock", isAuthenticated, userController.postUnlockPrompt);

// Add Fund Page
router.get("/add-fund", isAuthenticated, userController.getAddFund);

// Verify Payment
router.post(
  "/verify-payment-paytm",
  isAuthenticated,
  paymentController.verifyUTR,
);
router.post(
  "/verify-payment-bharatPay",
  isAuthenticated,
  paymentController.verifyBharatPayUTR,
);

// Refer & Earn
router.get("/refer-earn", userController.getReferEarn);

router.get("/transactions", isAuthenticated, userController.getTransactions);

// My Unlocks
router.get("/my-unlocks", isAuthenticated, userController.getMyUnlocks);

router.get("/how-to-use", userController.getHowToUse);

router.get("/withdraw", isAuthenticated, userController.getWithdraw);
router.post("/withdraw", isAuthenticated, userController.postWithdraw);

router.get(
  "/change-password",
  isAuthenticated,
  authController.getChangePassword,
);
router.post(
  "/change-password",
  isAuthenticated,
  authController.postChangePassword,
);

// ======================
// Admin Routes
// ======================

// Admin Login Page
router.get("/admin", isAdminGuest, adminController.loginPage);
router.get("/admin/login", isAdminGuest, adminController.loginPage);
router.post("/admin/login", isAdminGuest, adminController.login);
router.get("/admin/logout", isAdminAuthenticated, adminController.logout);

// Admin Dashboard
router.get(
  "/admin/dashboard",
  isAdminAuthenticated,
  adminController.getDashboard,
);

// Admin Settings
router.get(
  "/admin/settings",
  isAdminAuthenticated,
  adminController.getSettings,
);

router.post(
  "/admin/settings",
  isAdminAuthenticated,
  adminController.updateSettings,
);

// Admin Prompts
router.get("/admin/prompts", isAdminAuthenticated, adminController.getPrompts);

// Add Prompt
router.post(
  "/admin/add-prompt",
  isAdminAuthenticated,
  adminController.postAddPrompt,
);

router.get(
  "/admin/edit-prompt/:id",
  isAdminAuthenticated,
  adminController.editPromptPage,
);

router.post(
  "/admin/update-prompt/:id",
  isAdminAuthenticated,
  adminController.updatePrompt,
);

router.get(
  "/admin/delete-prompt/:id",
  isAdminAuthenticated,
  adminController.deletePrompt,
);

router.get("/admin/prompts", isAdminAuthenticated, adminController.getPrompts);

router.get(
  "/admin/add-prompt",
  isAdminAuthenticated,
  adminController.addPromptPage,
);

// Admin Categories
router.get(
  "/admin/categories",
  isAdminAuthenticated,
  adminController.getCategories,
);

router.get(
  "/admin/add-category",
  isAdminAuthenticated,
  adminController.addCategoryPage,
);

router.post(
  "/admin/add-category",
  isAdminAuthenticated,
  adminController.postAddCategory,
);

router.get(
  "/admin/edit-category/:id",
  isAdminAuthenticated,
  adminController.editCategoryPage,
);

router.post(
  "/admin/update-category/:id",
  isAdminAuthenticated,
  adminController.updateCategory,
);

router.get(
  "/admin/delete-category/:id",
  isAdminAuthenticated,
  adminController.deleteCategory,
);

router.get("/admin/users", isAdminAuthenticated, adminController.getUsers);

router.get(
  "/admin/transactions",
  isAdminAuthenticated,
  adminController.getTransactions,
);

router.get(
  "/admin/contact-messages",
  isAdminAuthenticated,
  adminController.getContactMessages,
);

router.post(
  "/admin/update-wallet",
  isAdminAuthenticated,
  adminController.updateWallet,
);
router.get(
  "/admin/withdrawals",
  isAdminAuthenticated,
  adminController.getWithdrawals,
);
router.post(
  "/admin/withdraw-action",
  isAdminAuthenticated,
  adminController.withdrawAction,
);
router.post(
  "/admin/update-user-status",
  isAdminAuthenticated,
  adminController.updateUserStatus,
);
router.get(
  "/admin/change-password",
  isAdminAuthenticated,
  adminController.getChangePassword,
);

router.post(
  "/admin/change-password",
  isAdminAuthenticated,
  adminController.postChangePassword,
);

// ======================
// Export Router
// ======================

module.exports = router;
