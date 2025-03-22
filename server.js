require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const folderRoutes = require("./routes/folderRoutes");
const profileRoutes = require("./routes/profileRoutes");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());


// Connect Database
connectDB();


// Routes
app.use("/api/auth", authRoutes);  // Auth routes for login, register, etc.
app.use("/api/files", fileRoutes);  // File routes for managing files
app.use("/api/folders", folderRoutes);  // Folder routes for folder management
app.use("/api/profile", profileRoutes);  // Folder routes for folder management

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
