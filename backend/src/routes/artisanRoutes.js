const router = require('express').Router();
const { listArtisans, getArtisan, createOrUpdateOwnListing, getMeta } = require('../controllers/artisanController');
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { artisanSchema } = require('../validators/artisanValidators');

router.get('/', listArtisans);
router.get('/meta', getMeta); // must be before /:id, otherwise "meta" is parsed as an id
router.get('/:id', optionalAuth, getArtisan);
router.post('/me', protect, restrictTo('artisan'), validate(artisanSchema), createOrUpdateOwnListing);

module.exports = router;
