const router = require('express').Router();
const {
  createBooking,
  myBookings,
  receivedBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const { protect, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createBookingSchema, updateBookingSchema } = require('../validators/bookingValidators');

router.post('/', protect, validate(createBookingSchema), createBooking);
router.get('/mine', protect, myBookings);
router.get('/received', protect, restrictTo('artisan'), receivedBookings);
router.patch('/:id', protect, restrictTo('artisan'), validate(updateBookingSchema), updateBookingStatus);

module.exports = router;
