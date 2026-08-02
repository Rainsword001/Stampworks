const { z } = require('zod');

exports.createBookingSchema = z.object({
  artisanId: z.coerce.number().int().positive(),
  message: z.string().min(5, 'Please add a bit more detail').max(500),
  preferredDate: z.string().optional(), // YYYY-MM-DD
});

exports.updateBookingSchema = z.object({
  status: z.enum(['accepted', 'declined', 'completed']),
});
