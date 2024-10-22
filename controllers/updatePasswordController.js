const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("../helpers/userHelper");
const MESSAGES = require("../utils/messages");
require("dotenv").config();

const validateOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    if (Date.now() > user.otpExpiry) {
      return res.status(400).json({ message: MESSAGES.OTP_EXPIRED });
    }

    const isValidOtp = bcrypt.compareSync(otp.toString(), user.otp);
    if (!isValidOtp) {
      return res.status(400).json({ message: MESSAGES.INVALID_OTP });
    }

    user.password = bcrypt.hashSync(newPassword, 10);
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({ message: MESSAGES.PASSWORD_UPDATED });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: MESSAGES.INTERNAL_ERROR });
  }
};

module.exports = {
  validateOtp,
};
