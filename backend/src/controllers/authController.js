const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { generateOtp, hashSecret } = require('../utils/otp');
const {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendOtpEmail,
} = require('../services/email.service');

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

async function issueOtp(user) {
  const rawOtp = generateOtp();
  user.otpHash = hashSecret(rawOtp);
  user.otpExpires = new Date(Date.now() + OTP_TTL_MS);
  await user.save();
  // Fire-and-forget: a slow/broken mail provider shouldn't delay or fail the request.
  sendOtpEmail(user.email, user.name, rawOtp).catch(() => {});
}

// POST /api/auth/signup
// Creates the account but does NOT log the person in yet — email must be
// verified first via /verify-email. No JWT is issued here on purpose.
exports.signup = catchAsync(async (req, res, next) => {
  const { name, email, phone, password, role } = req.body;

  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) return next(new AppError('Email already in use', 409));

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role });

  await issueOtp(user);

  res.status(201).json({
    status: 'success',
    message: 'Account created. Check your email for a 6-digit verification code.',
    email: user.email,
  });
});

// POST /api/auth/verify-email  { email, otp }
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (!user) return next(new AppError('Invalid email or code', 400));
  if (user.emailVerified) return next(new AppError('This email is already verified — you can log in.', 400));
  if (!user.otpHash || !user.otpExpires || user.otpExpires < new Date()) {
    return next(new AppError('This code has expired. Request a new one.', 400));
  }
  if (hashSecret(String(otp)) !== user.otpHash) {
    return next(new AppError('Incorrect code', 400));
  }

  user.emailVerified = true;
  user.otpHash = null;
  user.otpExpires = null;
  await user.save();

  sendWelcomeEmail(user.email, user.name, user.role).catch(() => {});

  const token = signToken(user.id);
  res.json({ status: 'success', message: 'Email verified', token, user: user.toSafeJSON() });
});

// POST /api/auth/resend-otp  { email }
exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  const genericResponse = { status: 'success', message: 'If that account needs verifying, a new code has been sent.' };

  const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
  if (!user) return res.json(genericResponse);
  if (user.emailVerified) return res.json({ status: 'success', message: 'This email is already verified — you can log in.' });

  await issueOtp(user);
  res.json(genericResponse);
});

// POST /api/auth/login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect email or password', 401));
  }
  if (!user.emailVerified) {
    // Distinct shape (not just a plain AppError) so the frontend can tell
    // "wrong password" apart from "right password, unverified account"
    // and route to the verification modal instead of a generic error.
    return res.status(403).json({
      status: 'fail',
      message: 'Please verify your email before logging in.',
      needsVerification: true,
      email: user.email,
    });
  }

  const token = signToken(user.id);
  res.json({ status: 'success', token, user: user.toSafeJSON() });
});

// POST /api/auth/forgot-password  { email }
// Always responds with the same generic message whether or not the email
// exists — this prevents attackers from using this endpoint to discover
// which emails have accounts (a classic account-enumeration leak).
exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const genericResponse = { status: 'success', message: 'If that email has an account, a reset link has been sent.' };

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) return res.json(genericResponse);

  const rawToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordTokenHash = hashSecret(rawToken);
  user.resetPasswordExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const origin = process.env.CLIENT_ORIGIN && process.env.CLIENT_ORIGIN !== '*' ? process.env.CLIENT_ORIGIN : '';
  const resetUrl = `${origin}/?token=${rawToken}`;
  const result = await sendPasswordResetEmail(user.email, resetUrl);

  // Only fall back to handing back the raw link if the email genuinely
  // wasn't sent (no SMTP configured, or the send failed) — a correctly
  // configured SMTP should never show this, in dev or production.
  if (!result.sent) {
    return res.json({ ...genericResponse, devResetUrl: resetUrl });
  }
  res.json(genericResponse);
});

// POST /api/auth/reset-password/:token  { password }
exports.resetPassword = catchAsync(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    where: {
      resetPasswordTokenHash: hashSecret(token),
      resetPasswordExpires: { [Op.gt]: new Date() },
    },
  });
  if (!user) return next(new AppError('This reset link is invalid or has expired', 400));

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetPasswordTokenHash = null;
  user.resetPasswordExpires = null;
  await user.save();

  const jwtToken = signToken(user.id);
  res.json({ status: 'success', message: 'Password updated', token: jwtToken, user: user.toSafeJSON() });
});
