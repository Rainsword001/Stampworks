const { z } = require('zod');

exports.createReviewSchema = z.object({
  bookingId: z.coerce.number().int().positive(),
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().max(500).optional(),
});
