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
    // Remove the 'uploaded' column in case of rollback
    await queryInterface.removeColumn("Documents", "uploaded");

    // Remove the unique constraint if rolling back
    await queryInterface.removeConstraint("Documents", "id");
  },
};
