const express = require("express");
const { register, login, verifyEmail, forgotPassword, resetPassword } = require("../controllers/authController");

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
// router.post("/verify-otp", verifyOTP);
router.get("/verify-email/:token", verifyEmail);
router.post("/reset-password", resetPassword);

module.exports = router;
