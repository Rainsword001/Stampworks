const { Op } = require('sequelize');
const { Artisan, Booking } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const PUBLIC_ATTRS = { exclude: ['phone'] };

// GET /api/artisans?trade=Plumbing&state=Rivers&city=Port%20Harcourt&search=leak&sort=rating
exports.listArtisans = catchAsync(async (req, res) => {
  const { trade, state, city, search, sort } = req.query;
  const where = {};
  if (trade) where.trade = trade;
  if (state) where.state = state;
  if (city) where.city = { [Op.like]: `%${city}%` };
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { bio: { [Op.like]: `%${search}%` } },
      { area: { [Op.like]: `%${search}%` } },
      { city: { [Op.like]: `%${search}%` } },
      { trade: { [Op.like]: `%${search}%` } },
    ];
  }

  let order = [['createdAt', 'DESC']];
  if (sort === 'rating') order = [['ratingAvg', 'DESC']];
  else if (sort === 'exp') order = [['yearsExp', 'DESC']];

  const artisans = await Artisan.findAll({ where, order, limit: 100, attributes: PUBLIC_ATTRS });
  res.json({ status: 'success', results: artisans.length, data: artisans });
});

// GET /api/artisans/meta — trades + states, for populating frontend dropdowns
// without hardcoding the lists in two places.
exports.getMeta = catchAsync(async (req, res) => {
  res.json({ status: 'success', data: { trades: Artisan.TRADES, states: Artisan.NIGERIA_STATES } });
});

// GET /api/artisans/:id
// Phone is only included if the requester has an existing booking with
// this artisan — enforced here, not in the frontend.
exports.getArtisan = catchAsync(async (req, res, next) => {
  const artisan = await Artisan.findByPk(req.params.id, { attributes: PUBLIC_ATTRS });
  if (!artisan) return next(new AppError('Artisan not found', 404));

  let phone;
  if (req.user) {
    const hasBooking = await Booking.findOne({
      where: {
        artisanId: artisan.id,
        customerId: req.user.id,
        status: { [Op.in]: ['pending', 'accepted', 'completed'] },
      },
    });
    if (hasBooking) {
      const full = await Artisan.findByPk(artisan.id, { attributes: ['phone'] });
      phone = full.phone;
    }
  }

  res.json({ status: 'success', data: { ...artisan.toJSON(), phone } });
});

// POST /api/artisans/me  (auth required, role: artisan)
// Creates the caller's listing if one doesn't exist yet, otherwise updates it.
exports.createOrUpdateOwnListing = catchAsync(async (req, res) => {
  const { trade, state, city, area, bio, yearsExp, priceRange, phone, lat, lng } = req.body;

  const [artisan] = await Artisan.upsert(
    {
      userId: req.user.id,
      name: req.user.name,
      trade,
      state,
      city,
      area,
      bio,
      yearsExp,
      priceRange,
      phone,
      lat,
      lng,
    },
    { returning: true }
  );

  res.status(200).json({ status: 'success', data: artisan });
});
