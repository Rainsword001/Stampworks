const { Review, Booking, Artisan } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// POST /api/reviews  (only after a completed booking, one review per booking)
exports.createReview = catchAsync(async (req, res, next) => {
  const { bookingId, rating, comment } = req.body;

  const booking = await Booking.findByPk(bookingId);
  if (!booking) return next(new AppError('Booking not found', 404));
  if (booking.customerId !== req.user.id) {
    return next(new AppError('You cannot review this job', 403));
  }
  if (booking.status !== 'completed') {
    return next(new AppError('You can only review completed jobs', 400));
  }

  const review = await Review.create({
    artisanId: booking.artisanId,
    customerId: req.user.id,
    bookingId,
    rating,
    comment,
  });

  // Recalculate the artisan's aggregate rating from all reviews.
  const stats = await Review.findAll({
    where: { artisanId: booking.artisanId },
    attributes: [
      [Review.sequelize.fn('AVG', Review.sequelize.col('rating')), 'avg'],
      [Review.sequelize.fn('COUNT', Review.sequelize.col('id')), 'count'],
    ],
    raw: true,
  });

  if (stats.length && stats[0].count > 0) {
    await Artisan.update(
      {
        ratingAvg: Math.round(stats[0].avg * 10) / 10,
        reviewCount: stats[0].count,
      },
      { where: { id: booking.artisanId } }
    );
  }

  res.status(201).json({ status: 'success', data: review });
});

// GET /api/reviews/artisan/:id
exports.getArtisanReviews = catchAsync(async (req, res) => {
  const { User } = require('../models');
  const reviews = await Review.findAll({
    where: { artisanId: req.params.id },
    include: [{ model: User, as: 'customer', attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ status: 'success', results: reviews.length, data: reviews });
});
