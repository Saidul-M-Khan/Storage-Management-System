const express = require("express");
const router = express.Router();
const { createFolder, moveFolder, deleteFolder } = require("../controllers/folderController");
const {verifyToken} = require("../middleware/authMiddleware");

router.post("/create", verifyToken, createFolder);
router.put("/move/:folderId", verifyToken, moveFolder);
router.delete("/delete/:folderId", verifyToken, deleteFolder);

module.exports = router;
