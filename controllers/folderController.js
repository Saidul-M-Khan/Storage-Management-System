const Folder = require("../models/Folder");

// 📌 Create Folder
exports.createFolder = async (req, res) => {
    const folder = await Folder.create({
        userId: req.userId,
        name: req.body.name
    });
    res.json(folder);
};

// 📌 Move Folder
exports.moveFolder = async (req, res) => {
    const folder = await Folder.findById(req.params.folderId);
    folder.parentFolder = req.body.parentFolder || null;
    await folder.save();
    res.json(folder);
};

// 📌 Delete Folder
exports.deleteFolder = async (req, res) => {
    await Folder.findByIdAndDelete(req.params.folderId);
    res.json({ message: "Folder deleted successfully" });
};
