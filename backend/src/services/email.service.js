const { isConfigured, getTransporter, getDefaultFrom } = require('../config/mail.config');
const otpTemplate = require('../templates/otp.template');
const welcomeTemplate = require('../templates/welcome.template');
const passwordResetTemplate = require('../templates/password-reset.template');
const bookingRequestTemplate = require('../templates/booking-request.template');
const bookingAcceptedTemplate = require('../templates/booking-accepted.template');

// Generic sender. Every specific email function below builds a
// {subject, text, html} object from a template and passes it through here.
// Never throws — a broken/unconfigured mail provider should never take
// down signup, booking, or password-reset flows that only need the
// *side effect* of an email; callers get {sent: false, reason} instead.
async function send({ to, subject, text = '', html = '' }) {
  if (!to) throw new Error('Recipient email is required.');
  if (!subject) throw new Error('Email subject is required.');

  if (!isConfigured()) {
    console.warn('\n[Mail] SMTP not configured — email not sent (dev only):');
    console.log({ to, subject, text });
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    const info = await getTransporter().sendMail({ from: getDefaultFrom(), to, subject, text, html });
    console.log(`[Mail] Sent to ${to}: "${subject}"`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Mail] Failed to send to ${to}:`, error.message);
    return { sent: false, reason: 'send_failed', error: error.message };
  }
}

async function sendOtpEmail(email, name, otp) {
  return send({ to: email, ...otpTemplate({ name, otp }) });
}

async function sendWelcomeEmail(email, name, role) {
  return send({ to: email, ...welcomeTemplate({ name, role }) });
}

async function sendPasswordResetEmail(email, resetUrl) {
  return send({ to: email, ...passwordResetTemplate({ resetUrl }) });
}

async function sendNewBookingEmail(artisanEmail, artisanName, customerName, message) {
  return send({ to: artisanEmail, ...bookingRequestTemplate({ artisanName, customerName, message }) });
}

async function sendBookingAcceptedEmail(customerEmail, customerName, artisanName) {
  return send({ to: customerEmail, ...bookingAcceptedTemplate({ customerName, artisanName }) });
}

module.exports = {
  send,
  sendOtpEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendNewBookingEmail,
  sendBookingAcceptedEmail,
};
