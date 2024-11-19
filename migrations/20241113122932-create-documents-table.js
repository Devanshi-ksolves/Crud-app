"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("Documents", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Users", 
          key: "id",
        },
        onDelete: "CASCADE",
      },
      documentType: {
        type: Sequelize.ENUM(
          "aadhaar_card",
          "pan_card",
          "driving_license",
          "passport",
          "voter_id",
          "birth_certificate",
          "address_proof",
          "income_proof",
          "employment_letter",
          "bank_statement",
          "utility_bill",
          "other"
        ),
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: "pending",
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("Documents");
  },
};
