"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Document, {
        foreignKey: "userId",
        as: "documents",
        onDelete: "CASCADE",
      });
    }

    static hashPassword(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }

    validatePassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }

  User.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: DataTypes.STRING,
      role: {
        type: DataTypes.STRING,
        defaultValue: "user",
        validate: {
          isIn: [["user", "admin", "super_admin"]],
        },
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      otpExpiry: DataTypes.DATE,
      lastOtpSent: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      profilePicture: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      document: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      privileges: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "User",
      timestamps: true,
    }
  );
  User.beforeCreate((user) => {
    user.password = User.hashPassword(user.password);
  });

  return User;
};
