const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    storageUsed: { type: Number, default: 0 }, // Bytes used
    storageLimit: { type: Number, default: 15 * 1024 * 1024 * 1024 },
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "File", default:null }],
    createdAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    resetOTP: { type: String, default: null },
    otpExpiry: { type: Date, default: null }
});

module.exports = mongoose.model("User", UserSchema);
