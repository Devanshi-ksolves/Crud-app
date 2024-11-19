const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send an OTP email to the user.
 * @param {string} email - The recipient's email.
 * @param {number} otp - The OTP code to send.
 */
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    from: '"Curd_App" <devanshi.pathak@ksolves.com>',
    to: email,
    subject: "Your Password Reset OTP",
    text: `Your OTP for password reset is ${otp}. This OTP is valid for 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

/**
 *
 * @param {string} to - The recipient's email.
 * @param {string} subject - Email's Subject
 * @param {string} text - Email's text
 */
const sendEmail = async (to, subject, text) => {
  const mailOptions = {
    from: '"Curd_App" <devanshi.pathak@ksolves.com>',
    to,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  sendOtpEmail,
  sendEmail,
};
