const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // Use App Password, NOT your Gmail password
    }
});

const sendEmail = async (email, subject, message) => {
    try {
        await transporter.sendMail({
            from: `"Jotter Support" <${process.env.EMAIL_USER}>`, 
            to: email,
            subject,
            text: message,
        });
        console.log(`📧 Email sent to ${email}`);
    } catch (error) {
        console.error("❌ Error sending email:", error);
    }
};

module.exports = sendEmail;