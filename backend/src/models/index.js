// Wires up associations in one place so models stay simple, and gives
// controllers a single require target: const { User, Artisan, ... } = require('../models');
const User = require('./User');
const Artisan = require('./Artisan');
const Booking = require('./Booking');
const Review = require('./Review');

// A user who is an artisan has exactly one Artisan profile.
User.hasOne(Artisan, { foreignKey: { name: 'userId', allowNull: false, unique: true }, onDelete: 'CASCADE' });
Artisan.belongsTo(User, { foreignKey: 'userId' });

// Bookings link a customer (User) to an Artisan.
Artisan.hasMany(Booking, { foreignKey: { name: 'artisanId', allowNull: false } });
Booking.belongsTo(Artisan, { foreignKey: 'artisanId' });

User.hasMany(Booking, { foreignKey: { name: 'customerId', allowNull: false }, as: 'customerBookings' });
Booking.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

// One review per booking (enforced with a unique FK below).
Booking.hasOne(Review, { foreignKey: { name: 'bookingId', allowNull: false, unique: true } });
Review.belongsTo(Booking, { foreignKey: 'bookingId' });

Artisan.hasMany(Review, { foreignKey: { name: 'artisanId', allowNull: false } });
Review.belongsTo(Artisan, { foreignKey: 'artisanId' });

User.hasMany(Review, { foreignKey: { name: 'customerId', allowNull: false }, as: 'customerReviews' });
Review.belongsTo(User, { foreignKey: 'customerId', as: 'customer' });

module.exports = { User, Artisan, Booking, Review };
