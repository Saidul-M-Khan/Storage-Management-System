const jwt = require("jsonwebtoken");
require("dotenv").config();
const User = require("../models/User");

exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (!token) return res.status(401).json({ error: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId);
        if (!req.user) return res.status(404).json({ error: "User not found" });

        next();
    } catch (err) {
        res.status(403).json({ error: "Forbidden" });
    }
};