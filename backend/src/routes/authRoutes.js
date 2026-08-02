const router = require('express').Router();
const {
  signup,
  login,
  verifyEmail,
  resendOtp,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/authValidators');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), resendOtp);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

module.exports = router;
