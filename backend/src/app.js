const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { CLIENT_ORIGIN } = require('./config/env.js');

const authRoutes = require('./routes/authRoutes');
const artisanRoutes = require('./routes/artisanRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: CLIENT_ORIGIN || '*' }));
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/bookings', bookingLimiter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/artisans', artisanRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);

// Serve the frontend as static files, so the whole app (API + UI) can be
// deployed as a single Render web service. If you deploy the frontend
// separately (e.g. Netlify), this block is harmless and just unused.
app.use(express.static(path.join(__dirname, '../../frontend')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.use('/api', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

module.exports = app;
