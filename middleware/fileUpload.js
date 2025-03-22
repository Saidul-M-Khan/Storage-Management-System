const multer = require("multer");
const User = require("../models/User");

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});

const fileFilter = async (req, file, cb) => {
    const user = await User.findById(req.user.id);
    if (!user) return cb(new Error("User not found"), false);

    const remainingStorage = user.storageLimit - user.usedStorage;
    if (file.size > remainingStorage) return cb(new Error("Not enough storage"), false);

    cb(null, true);
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
