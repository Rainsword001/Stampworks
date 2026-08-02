const { z } = require('zod');

exports.signupSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['customer', 'artisan']).default('customer'),
});

exports.loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

exports.forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email'),
});

exports.resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

exports.verifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  otp: z.string().length(6, 'Code must be 6 digits'),
});

exports.resendOtpSchema = z.object({
  email: z.string().email('Invalid email'),
});
