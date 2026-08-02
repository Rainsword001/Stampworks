const { Sequelize } = require('sequelize');
const { DB_STORAGE} = require('../config/env.js');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_STORAGE || './database.sqlite',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
});

module.exports = sequelize;
