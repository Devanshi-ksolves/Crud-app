const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { findUserByEmail } = require("../helpers/userHelper");
const MESSAGES = require("../utils/messages");
require("dotenv").config();

const validateOtp = async (req, res) => {
  const { email, otp, token, id } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.email !== email) {
      return res.status(403).json({ message: MESSAGES.INVALID_TOKEN });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.INVALID_USER });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: MESSAGES.OTP_EXPIRED });
    }

    const isValidOtp = bcrypt.compareSync(otp.toString(), user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: MESSAGES.INVALID_OTP });
    }

    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      message: MESSAGES.VALID_OTP,
    });
  } catch (error) {
    console.error(error);
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: MESSAGES.TOKEN_EXPIRED });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: MESSAGES.INVALID_TOKEN });
    }
    return res.status(500).json({ message: MESSAGES.INTERNAL_ERROR });
  }
};

module.exports = {
  validateOtp,
};
