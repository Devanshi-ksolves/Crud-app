"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("Documents", "documentType", {
      type: Sequelize.STRING(512),
      allowNull: false, 
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("Documents", "documentType", {
      type: Sequelize.STRING(255),
      allowNull: false,
    });
  },
};
