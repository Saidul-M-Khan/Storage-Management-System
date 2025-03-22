const mongoose = require("mongoose");

const FileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    folder: { type: mongoose.Schema.Types.ObjectId, ref: "File", default: null }, // Parent folder
    filename: String,
    fileType: String,
    size: Number,
    url: String,
    isFavorite: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("File", FileSchema);