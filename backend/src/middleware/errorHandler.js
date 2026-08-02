const AppError = require('../utils/AppError');

module.exports = function errorHandler(err, req, res, next) {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const message = err.errors.map((e) => e.message).join(', ');
    err = new AppError(message, err.name === 'SequelizeUniqueConstraintError' ? 409 : 400);
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    err = new AppError('Related record not found', 400);
  }

  if (process.env.NODE_ENV === 'development') console.error(err);

  res.status(err.statusCode).json({
    status: err.status,
    message: err.isOperational ? err.message : 'Something went wrong',
  });
};
