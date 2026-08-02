const { Artisan, Booking, User, Review } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { sendNewBookingEmail, sendBookingAcceptedEmail } = require('../services/email.service');

// POST /api/bookings  (customer books/requests an artisan)
exports.createBooking = catchAsync(async (req, res, next) => {
  const { artisanId, message, preferredDate } = req.body;

  const artisan = await Artisan.findByPk(artisanId);
  if (!artisan) return next(new AppError('Artisan not found', 404));

  const booking = await Booking.create({
    artisanId,
    customerId: req.user.id,
    message,
    preferredDate: preferredDate || null,
  });

  // Notify the artisan by email — fire-and-forget, shouldn't block the response.
  User.findByPk(artisan.userId)
    .then((artisanUser) => {
      if (artisanUser) return sendNewBookingEmail(artisanUser.email, artisanUser.name, req.user.name, message);
    })
    .catch(() => {});

  res.status(201).json({ status: 'success', data: booking });
});

// GET /api/bookings/mine  (customer's own bookings)
exports.myBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.findAll({
    where: { customerId: req.user.id },
    include: [
      { model: Artisan, attributes: ['id', 'name', 'trade', 'area'] },
      { model: Review, attributes: ['id', 'rating', 'comment'] },
    ],
    order: [['createdAt', 'DESC']],
  });
  res.json({ status: 'success', results: bookings.length, data: bookings });
});

// GET /api/bookings/received  (artisan's incoming bookings)
exports.receivedBookings = catchAsync(async (req, res, next) => {
  const artisan = await Artisan.findOne({ where: { userId: req.user.id } });
  if (!artisan) return next(new AppError('You do not have an artisan listing yet', 400));

  const bookings = await Booking.findAll({
    where: { artisanId: artisan.id },
    include: [{ model: User, as: 'customer', attributes: ['id', 'name', 'phone'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json({ status: 'success', results: bookings.length, data: bookings });
});

// PATCH /api/bookings/:id  (artisan accepts/declines/completes)
exports.updateBookingStatus = catchAsync(async (req, res, next) => {
  const artisan = await Artisan.findOne({ where: { userId: req.user.id } });
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) return next(new AppError('Booking not found', 404));
  if (!artisan || booking.artisanId !== artisan.id) {
    return next(new AppError('You cannot modify this booking', 403));
  }

  booking.status = req.body.status;
  await booking.save();

  // Notify the customer only when their request gets accepted — fire-and-forget.
  if (booking.status === 'accepted') {
    User.findByPk(booking.customerId)
      .then((customerUser) => {
        if (customerUser) return sendBookingAcceptedEmail(customerUser.email, customerUser.name, artisan.name);
      })
      .catch(() => {});
  }

  res.json({ status: 'success', data: booking });
});
