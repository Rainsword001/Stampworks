const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const TRADES = [
  'Plumbing',
  'Electrical',
  'Carpentry',
  'Masonry',
  'Painting',
  'Welding',
  'Roofing',
  'Landscaping',
];

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara',
];

const Artisan = sequelize.define('Artisan', {
  name: { type: DataTypes.STRING, allowNull: false },
  // Not an ENUM: TRADES below is the suggested list for the dropdown, but
  // users can type a custom trade via "Other", so the DB just stores text.
  trade: { type: DataTypes.STRING, allowNull: false, validate: { len: [2, 40] } },
  state: { type: DataTypes.ENUM(...NIGERIA_STATES), allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  area: { type: DataTypes.STRING, allowNull: false },
  bio: { type: DataTypes.TEXT, allowNull: false, validate: { len: [10, 600] } },
  yearsExp: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
  priceRange: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  lat: { type: DataTypes.FLOAT, allowNull: true },
  lng: { type: DataTypes.FLOAT, allowNull: true },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  ratingAvg: { type: DataTypes.FLOAT, defaultValue: 0 },
  reviewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
});

Artisan.TRADES = TRADES;
Artisan.NIGERIA_STATES = NIGERIA_STATES;

module.exports = Artisan;
