const { User } = require("../models");

/**
 * Find user by email.
 * @param {string} email - Email of the user to find.
 * @returns {Object|null} - User object if found, otherwise null.
 */
const findUserByEmail = async (email) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    throw new Error("Database query failed");
  }
};

module.exports = {
  findUserByEmail,
};
