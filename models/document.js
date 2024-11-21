"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Document extends Model {
    static associate(models) {
      Document.belongsTo(models.User, { foreignKey: "userId" });
    }
  }

  Document.init(
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      documentType: {
        type: DataTypes.ENUM(
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
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      uploaded: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      frontImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      backImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Document",
    }
  );

  return Document;
};
