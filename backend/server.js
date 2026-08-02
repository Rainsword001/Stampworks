require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');
const { verifyConnection } = require('./src/config/mail.config');
const { PORT } = require('./src/config/env.js');


async function start() {
  try {
    await sequelize.authenticate();
    console.log('SQLite connected');
    // Demo project: sync() auto-creates/updates tables from the models.
    // For a real production app you'd use migrations instead.
    await sequelize.sync();
    console.log('Models synced');

    await verifyConnection(); // logs whether SMTP is reachable — doesn't block startup either way

    app.listen(PORT, () => console.log(`Stampworks server is running`));
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
