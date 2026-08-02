const { z } = require('zod');
const Artisan = require('../models/Artisan');

exports.artisanSchema = z.object({
  // Free text, not restricted to Artisan.TRADES — that list is just the
  // frontend's dropdown suggestions; "Other" lets someone type any trade.
  trade: z.string().min(2, 'Trade is required').max(40, 'Trade name is too long'),
  state: z.enum(Artisan.NIGERIA_STATES),
  city: z.string().min(2, 'City is required'),
  area: z.string().min(2, 'Area is required'),
  bio: z.string().min(10, 'Bio is too short').max(600),
  yearsExp: z.coerce.number().nonnegative(),
  priceRange: z.string().min(1, 'Price range is required'),
  phone: z.string().min(7, 'Invalid phone number'),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
});
