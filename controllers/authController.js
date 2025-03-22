const User = require("../models/User");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
require("dotenv").config();

// Generate a JWT Token
const generateVerificationToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

//! Start
// // ✅ Register User
// exports.register = async (req, res) => {
//     try {
//         const { name, email, password } = req.body;
//         let user = await User.findOne({ email });

//         if (user) return res.status(400).json({ message: "User already exists" });

//         user = new User({ name, email, password });
//         await user.save();

//         // Generate verification token
//         const verificationToken = generateVerificationToken(user._id);

//         // Send token via email
//         await sendEmail(email, "Verify Your Email", `Your verification code is: ${verificationToken}`);

//         res.status(201).json({ message: "Registration successful. Check your email for verification.",  verificationToken});

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Verify Email
// exports.verifyEmail = async (req, res) => {
//     try {
//         const { token } = req.body;

//         if (!token) return res.status(400).json({ message: "Token is missing" });

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);
//         const user = await User.findById(decoded.userId);

//         if (!user) return res.status(404).json({ message: "User not found" });
//         if (user.verified) return res.status(400).json({ message: "Email is already verified" });

//         user.verified = true;
//         await user.save();

//         res.status(200).json({ message: "Email verified successfully" });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// // Login User
// exports.login = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         // Find the user by email
//         const user = await User.findOne({ email });

//         // Check if user exists
//         if (!user) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         // Compare the provided password with the stored hashed password
//         const isPasswordCorrect = await bcrypt.compare(password, user.password);

//         // If password doesn't match, return an error
//         if (!isPasswordCorrect) {
//             return res.status(401).json({ message: "Invalid credentials" });
//         }

//         // If email is not verified, return an error
//         // if (!user.verified) {
//         //     return res.status(403).json({ message: "Please verify your email before logging in." });
//         // }

//         // Create a JWT token with the user ID
//         const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

//         // Return the token to the client
//         res.status(200).json({ message: "Login successful", token });

//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

//! END

// ✅ Generate JWT Token
const generateToken = (userId, expiresIn) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn });
};

const updatePassword = async (email, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });
    console.log("Password updated successfully.");
};

// ✅ Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Ensure password is a string
        const normalizedPassword = String(password || "");

        // Check if user already exists
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(normalizedPassword, salt);

        // Create a new user
        user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Generate email verification token (valid for 1 hour)
        const verificationToken = generateToken(user._id, "1h");

        // Generate verification link
        const verificationLink = `${process.env.CLIENT_URL}/api/auth/verify-email/${verificationToken}`;

        // Send verification email
        await sendEmail(email, "Verify Your Email", `Click to verify your email: ${verificationLink}`);

        res.status(201).json({ message: "Registration successful. Check your email for verification." });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ✅ Verify Email
exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        if (!token) return res.status(400).json({ message: "Token is missing" });

        // Decode and verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.verified) return res.status(400).json({ message: "Email is already verified" });

        // Mark email as verified
        user.verified = true;
        await user.save();

        res.status(200).json({ message: "Email verified successfully. You can now log in." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ensure password is a string
        const normalizedPassword = String(password || "");

        // Find the user by email
        const user = await User.findOne({ email });
        
        if (!user) return res.status(401).json({ message: "Invalid credentials" });
        
        // Compare passwords with bcryptjs
        const isPasswordCorrect = await bcrypt.compare(normalizedPassword, user.password);
        
        console.log("Password match result:", isPasswordCorrect);

        if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid credentials" });

        // Check if email is verified
        if (!user.verified) {
            return res.status(403).json({ message: "Please verify your email before logging in." });
        }

        // Generate authentication token (valid for 7 days)
        const token = generateToken(user._id, "7d");

        // Store token securely in HTTP-only cookie
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production", // Use secure cookies in production
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(200).json({ message: "Login successful", token });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: error.message });
    }
};

// ✅ Forgot Password - Generate OTP
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        // Generate a 6-digit OTP
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpiry = Date.now() + 15 * 60 * 1000; // OTP expires in 15 minutes

        // Store OTP in the user document
        user.resetOTP = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        // Send OTP via email
        await sendEmail(email, "Password Reset OTP", `Your OTP code is: ${otp}`);

        res.status(200).json({ message: "OTP sent to your email." });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Reset Password - Verify OTP
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(404).json({ message: "User not found" });

        // 🔹 Validate OTP
        if (!user.resetOTP || user.resetOTP !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        // 🔹 Check OTP expiry
        if (!user.otpExpiry || user.otpExpiry < Date.now()) {
            return res.status(400).json({ message: "OTP has expired" });
        }

        // 🔹 Hash the new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 🔹 Clear OTP fields
        user.resetOTP = null;
        user.otpExpiry = null;

        await user.save();
        res.status(200).json({ message: "Password reset successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ✅ Logout
exports.logout = (req, res) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        return res.status(400).json({ message: "No token provided." });
    }

    tokenBlacklist.add(token); // Add token to blacklist
    res.status(200).json({ message: "Logout successful." });
};
