const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("../helpers/userHelper");
const MESSAGES = require("../utils/messages");
const { sendOtpEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Generate random OTP (4 digits)
const generateOtp = () => Math.floor(1000 + Math.random() * 9000);

const forgetPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    const currentTime = Date.now();
    const otpSentAt = user.lastOtpSent ? new Date(user.lastOtpSent) : null;
    const timeDifference = otpSentAt ? (currentTime - otpSentAt) / 1000 : 31;
    if (otpSentAt && timeDifference < 30) {
      return res.status(429).json({
        message: `Please wait ${
          30 - Math.floor(timeDifference)
        } seconds before requesting a new OTP`,
      });
    }

    const otp = generateOtp();
    const otpExpiry = Date.now() + process.env.OTP_EXPIRY * 60 * 1000;

    user.otp = bcrypt.hashSync(otp.toString(), 10);
    user.otpExpiry = otpExpiry;
    user.lastOtpSent = currentTime;
    await user.save();

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });

    res.cookie("authToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000,
    });

    await sendOtpEmail(user.email, otp);

    return res.status(200).json({ message: MESSAGES.OTP_SENT, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: MESSAGES.INTERNAL_ERROR });
  }
};

module.exports = {
  forgetPassword,
};
