const { config } = require('dotenv');

config({
  path: `.env.${process.env.NODE_ENV || 'development'}`,
});

const env = {
  PORT: process.env.PORT,
  DB_STORAGE: process.env.DB_STORAGE,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: Number(process.env.SMTP_PORT),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  EMAIL_FROM: process.env.EMAIL_FROM,
};

module.exports = env;