const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
  message: { type: DataTypes.TEXT, allowNull: false, validate: { len: [5, 500] } },
  preferredDate: { type: DataTypes.DATEONLY, allowNull: true },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'completed'),
    allowNull: false,
    defaultValue: 'pending',
  },
});

module.exports = Booking;
