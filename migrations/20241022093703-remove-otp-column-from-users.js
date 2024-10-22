"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("Users", "otp");
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("Users", "otp", {
      type: Sequelize.STRING,
      allowNull: true, 
    });
  },
};
