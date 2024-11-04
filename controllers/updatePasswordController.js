const bcrypt = require("bcryptjs");
const { findUserByEmail } = require("../helpers/userHelper");
const MESSAGES = require("../utils/messages");
require("dotenv").config();

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: MESSAGES.USER_NOT_FOUND });
    }

    user.password = bcrypt.hashSync(newPassword, 10);

    await user.save();

    return res.status(200).json({ message: MESSAGES.PASSWORD_UPDATED });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: MESSAGES.INTERNAL_ERROR });
  }
};

module.exports = {
  resetPassword,
};
