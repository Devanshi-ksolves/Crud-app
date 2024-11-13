"use strict";
const { Model } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */

    static hashPassword(password) {
      return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
    }

    validatePassword(password) {
      return bcrypt.compareSync(password, this.password);
    }
  }
  User.init(
    {
      name: DataTypes.STRING,
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
    }
  );
  User.beforeCreate((user) => {
    user.password = User.hashPassword(user.password);
  });

  return User;
};
