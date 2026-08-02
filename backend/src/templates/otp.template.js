const escapeHtml = require('../utils/escapeHtml');

function otpTemplate({ name, otp }) {
  const safeName = escapeHtml(name);
  return {
    subject: 'Verify your Stampworks email',
    text: `Hi ${name}, your verification code is ${otp}. This code expires in 10 minutes.`,
    html: `
      <h2>Verify your email</h2>
      <p>Hello <strong>${safeName}</strong>,</p>
      <p>Your verification code is:</p>
      <h1 style="letter-spacing:8px;">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p>If you didn't create a Stampworks account, you can ignore this email.</p>
    `,
  };
}

module.exports = otpTemplate;
