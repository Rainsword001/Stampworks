const { config } = require('dotenv');

config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});


// Load environment variables from .env file
const env = {
  PORT: process.env.PORT,
  DB_STORAGE: process.env.DB_STORAGE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  EMAIL_FROM: process.env.EMAIL_FROM,
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME,
};

module.exports = env;