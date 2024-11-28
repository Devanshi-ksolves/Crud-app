"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Documents", "uploaded", {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });

    await queryInterface.addConstraint("Documents", {
      fields: ["id"],
      type: "unique",
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Documents", "uploaded");

    await queryInterface.removeConstraint("Documents", "id");
  },
};
