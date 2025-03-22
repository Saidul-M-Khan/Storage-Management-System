const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const User = require("../models/User");
const File = require("../models/File");
const Folder = require("../models/Folder");

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

const upload = multer({
    storage: multerS3({
        s3,
        bucket: process.env.AWS_S3_BUCKET,
        acl: "public-read",
        key: function (req, file, cb) {
            cb(null, `${req.userId}/${Date.now()}_${file.originalname}`);
        }
    })
});

// 📌 Get all files or filter by search and date
exports.getFiles = async (req, res) => {
    try {
        const { userId } = req; // Extract user ID from auth middleware
        const { search, startDate, endDate } = req.query;

        let query = { userId }; // Base query to fetch user's files

        // 🔹 Filter by date range if provided
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // 🔹 Search by filename if provided
        if (search) {
            query.filename = { $regex: search, $options: "i" }; // Case-insensitive search
        }

        // Fetch filtered or all files
        const files = await File.find(query);

        res.json({ files, totalFiles: files.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Upload File (Image, PDF, Note)
exports.uploadFile = upload.single("file"), async (req, res) => {
    const { userId } = req;
    const { folderId } = req.body;
    const user = await User.findById(userId);

    if (user.storageUsed + req.file.size > user.storageLimit) {
        return res.status(400).json({ error: "Storage limit exceeded" });
    }

    const file = await File.create({
        userId,
        folderId: folderId || null,
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        size: req.file.size,
        url: req.file.location
    });

    user.storageUsed += req.file.size;
    await user.save();
    res.json(file);
};

// 📌 Get Storage Summary (Total, Used, Remaining)
exports.getUserStorage = async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
        totalStorage: user.storageLimit,
        usedStorage: user.storageUsed,
        remainingStorage: user.storageLimit - user.storageUsed
    });
};

// 📌 Get Dashboard Data
exports.getDashboardSummary = async (req, res) => {
    const { userId } = req;
    const user = await User.findById(userId);
    const files = await File.find({ userId });
    const folders = await Folder.find({ userId });

    const breakdown = {
        images: files.filter(f => f.fileType.startsWith("image/")),
        pdfs: files.filter(f => f.fileType === "application/pdf"),
        notes: files.filter(f => f.fileType.includes("text"))
    };

    res.json({
        totalStorage: user.storageLimit,
        usedStorage: user.storageUsed,
        folders: { count: folders.length, size: folders.reduce((acc, f) => acc + f.size, 0) },
        images: { count: breakdown.images.length, size: breakdown.images.reduce((acc, f) => acc + f.size, 0) },
        pdfs: { count: breakdown.pdfs.length, size: breakdown.pdfs.reduce((acc, f) => acc + f.size, 0) },
        notes: { count: breakdown.notes.length, size: breakdown.notes.reduce((acc, f) => acc + f.size, 0) },
        recentUploads: files.slice(-5).reverse()
    });
};

// 📌 Search Files by Name
exports.searchFiles = async (req, res) => {
    const { userId } = req;
    const { query } = req.query;

    const files = await File.find({ userId, filename: new RegExp(query, "i") });
    res.json(files);
};

// 📌 Make File Favorite
exports.toggleFavorite = async (req, res) => {
    const file = await File.findById(req.params.fileId);
    file.isFavorite = !file.isFavorite;
    await file.save();
    res.json(file);
};

// 📌 Rename File
exports.renameFile = async (req, res) => {
    const file = await File.findById(req.params.fileId);
    file.filename = req.body.newName;
    await file.save();
    res.json(file);
};

// 📌 Duplicate File
exports.duplicateFile = async (req, res) => {
    const file = await File.findById(req.params.fileId);
    const newFile = new File({ ...file.toObject(), _id: undefined });
    await newFile.save();
    res.json(newFile);
};

// 📌 Move File to Another Folder
exports.moveFile = async (req, res) => {
    const file = await File.findById(req.params.fileId);
    file.folderId = req.body.folderId || null;
    await file.save();
    res.json(file);
};

// 📌 Delete File
exports.deleteFile = async (req, res) => {
    const file = await File.findById(req.params.fileId);
    const user = await User.findById(file.userId);

    const s3Params = { Bucket: process.env.AWS_S3_BUCKET, Key: file.url.split(".amazonaws.com/")[1] };
    await s3.deleteObject(s3Params).promise();

    user.storageUsed -= file.size;
    await user.save();
    await file.remove();

    res.json({ message: "File deleted successfully" });
};

// 📌 View File (Return file details and URL)
exports.viewFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findById(fileId);

        if (!file) return res.status(404).json({ error: "File not found" });

        res.json({
            filename: file.filename,
            fileType: file.fileType,
            size: file.size,
            url: file.url
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Download File (Send file to user)
exports.downloadFile = async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findById(fileId);

        if (!file) return res.status(404).json({ error: "File not found" });

        const filePath = path.join(__dirname, "../uploads", file.filename);

        // Check if file exists on server
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "File not found on server" });
        }

        res.download(filePath, file.filename); // Trigger file download
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get all favorite files with search
exports.getFavoriteFiles = async (req, res) => {
    try {
        const { userId } = req;
        const { search } = req.query;

        let query = { userId, isFavorite: true };

        if (search) {
            query.filename = { $regex: search, $options: "i" }; // Case-insensitive search
        }

        const favorites = await File.find(query);
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get all folders with search
exports.getFolders = async (req, res) => {
    try {
        const { userId } = req;
        const { search } = req.query;

        let query = { userId, fileType: "folder" };

        if (search) {
            query.filename = { $regex: search, $options: "i" };
        }

        const folders = await File.find(query);
        res.json(folders);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get all images with search
exports.getImages = async (req, res) => {
    try {
        const { userId } = req;
        const { search } = req.query;

        let query = { userId, fileType: { $regex: "^image/", $options: "i" } };

        if (search) {
            query.filename = { $regex: search, $options: "i" };
        }

        const images = await File.find(query);
        res.json(images);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get all PDFs with search
exports.getPDFs = async (req, res) => {
    try {
        const { userId } = req;
        const { search } = req.query;

        let query = { userId, fileType: "application/pdf" };

        if (search) {
            query.filename = { $regex: search, $options: "i" };
        }

        const pdfs = await File.find(query);
        res.json(pdfs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Get all notes with search
exports.getNotes = async (req, res) => {
    try {
        const { userId } = req;
        const { search } = req.query;

        let query = { userId, fileType: { $regex: "text", $options: "i" } };

        if (search) {
            query.filename = { $regex: search, $options: "i" };
        }

        const notes = await File.find(query);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 📌 Filter files by type and date range
exports.getFilteredFiles = async (req, res) => {
    try {
        const { userId } = req;
        const { type, startDate, endDate, search } = req.query;

        let query = { userId };

        // 🔹 Filter by file type
        if (type) {
            if (type === "images") query.fileType = { $regex: "^image/", $options: "i" };
            else if (type === "pdfs") query.fileType = "application/pdf";
            else if (type === "notes") query.fileType = { $regex: "text", $options: "i" };
            else if (type === "folders") query.fileType = "folder";
        }

        // 🔹 Filter by date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // 🔹 Filter by filename (search)
        if (search) {
            query.filename = { $regex: search, $options: "i" }; // Case-insensitive search
        }

        const files = await File.find(query);
        res.json(files);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
