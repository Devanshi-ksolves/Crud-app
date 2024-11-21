"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Documents", "frontImage", {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Path to the front image of the document",
    });

    await queryInterface.addColumn("Documents", "backImage", {
      type: Sequelize.STRING,
      allowNull: true, 
      comment: "Path to the back image of the document",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Documents", "frontImage");
    await queryInterface.removeColumn("Documents", "backImage");
  },
};
