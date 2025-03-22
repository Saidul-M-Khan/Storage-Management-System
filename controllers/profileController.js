const bcrypt = require("bcryptjs");
const User = require("../models/User");  // Adjust the import based on your file structure

// Update username and/or password
exports.updateProfile = async (req, res) => {
    try {
        const { userId, newUsername, currentPassword, newPassword } = req.body;

        // Find the user by ID
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // If both username and password are provided
        if (newUsername && currentPassword && newPassword) {
            // Compare the current password
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update both username and password
            user.name = newUsername;
            user.password = hashedPassword;

            await user.save();

            return res.status(200).json({ message: "Profile updated successfully" });
        }

        // If only username is provided
        if (newUsername) {
            user.name = newUsername;
            await user.save();
            return res.status(200).json({ message: "Username updated successfully" });
        }

        // If only password is provided
        if (currentPassword && newPassword) {
            // Compare the current password
            const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: "Current password is incorrect" });
            }

            // Hash the new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password only
            user.password = hashedPassword;
            await user.save();

            return res.status(200).json({ message: "Password updated successfully" });
        }

        // If neither username nor password is provided
        return res.status(400).json({ message: "Please provide either a new username or a new password" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
