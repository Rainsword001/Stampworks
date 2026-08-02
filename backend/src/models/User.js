const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');
const sequelize = require('../config/db.js');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
    set(value) {
      this.setDataValue('email', value.toLowerCase().trim());
    },
  },
  phone: { type: DataTypes.STRING, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.ENUM('customer', 'artisan'),
    allowNull: false,
    defaultValue: 'customer',
  },
  // Forgot-password flow: a hashed, time-limited token. We store the hash
  // (never the raw token) so a leaked DB row can't be used to reset a
  // password — same principle as passwordHash.
  resetPasswordTokenHash: { type: DataTypes.STRING, allowNull: true },
  resetPasswordExpires: { type: DataTypes.DATE, allowNull: true },
  // Email verification (OTP sent at signup). Login is blocked until true.
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  otpHash: { type: DataTypes.STRING, allowNull: true },
  otpExpires: { type: DataTypes.DATE, allowNull: true },
});

User.prototype.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

User.prototype.toSafeJSON = function () {
  const { id, name, email, role, emailVerified } = this;
  return { id, name, email, role, emailVerified };
};

module.exports = User;
