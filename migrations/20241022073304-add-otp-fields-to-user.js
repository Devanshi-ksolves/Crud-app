"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("Users", "otp", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("Users", "otpExpiry", {
        type: Sequelize.DATE,
        allowNull: true,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("Users", "otp"),
      queryInterface.removeColumn("Users", "otpExpiry"),
    ]);
  },
};
