const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { User } = require('../models');
const { JWT_SECRET } = require('../config/env.js');

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
}

exports.protect = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next(new AppError('You must be logged in to do this', 401));

  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findByPk(decoded.id);
  if (!user) return next(new AppError('User no longer exists', 401));

  req.user = user;
  next();
});

exports.optionalAuth = catchAsync(async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (user) req.user = user;
  } catch (e) {
    // invalid/expired token on an optional route — proceed logged-out
  }
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(new AppError('You do not have permission to do this', 403));
  }
  next();
};
