const router = require('express').Router();
const { createReview, getArtisanReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createReviewSchema } = require('../validators/reviewValidators');

router.post('/', protect, validate(createReviewSchema), createReview);
router.get('/artisan/:id', getArtisanReviews);

module.exports = router;
