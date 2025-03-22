const express = require("express");
const {
    getFiles,
    viewFile,
    downloadFile,
    uploadFile,
    getUserStorage,
    getDashboardSummary,
    searchFiles,
    toggleFavorite,
    renameFile,
    moveFile,
    duplicateFile,
    deleteFile,
    getFavoriteFiles,
    getFolders,
    getImages,
    getPDFs,
    getNotes
} = require("../controllers/fileController");
const upload = require("../middleware/fileUpload");
const {verifyToken} = require("../middleware/authMiddleware");
const router = express.Router();

router.get("/", verifyToken, getFiles);
router.get("/view/:fileId", verifyToken, viewFile);
router.get("/download/:fileId", verifyToken, downloadFile);
router.post("/upload", verifyToken, upload.single("file"), uploadFile);
router.get("/storage", verifyToken, getUserStorage);
router.get("/dashboard", verifyToken, getDashboardSummary);
router.get("/search", verifyToken, searchFiles);
router.put("/favorite/:fileId", verifyToken, toggleFavorite);
router.put("/rename/:fileId", verifyToken, renameFile);
router.put("/move/:fileId", verifyToken, moveFile);
router.post("/duplicate/:fileId", verifyToken, duplicateFile);
router.delete("/delete/:fileId", verifyToken, deleteFile);
router.get("/favorites", verifyToken, getFavoriteFiles);
router.get("/folders", verifyToken, getFolders);
router.get("/images", verifyToken, getImages);
router.get("/pdfs", verifyToken, getPDFs);
router.get("/notes", verifyToken, getNotes);


module.exports = router;

// ✅ How It Works
// Feature	API Route	    Query Param (Search)
// Get favorites	        /api/files/favorites?search=name
// Get folders	            /api/files/folders?search=name
// Get images	            /api/files/images?search=name
// Get PDFs	                /api/files/pdfs?search=name
// Get notes	            /api/files/notes?search=name
