const escapeHtml = require('../utils/escapeHtml');
const emailLayout = require('./layout');
const { codeBlock } = require('./components');

function otpTemplate({ name, otp }) {
  const safeName = escapeHtml(name);

  const bodyHtml = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1F2421;">Verify your email</h2>
    <p style="margin:0 0 4px;">Hello <strong>${safeName}</strong>,</p>
    <p style="margin:0;">Enter this code to finish setting up your account:</p>
    ${codeBlock(otp)}
    <p style="margin:0;font-size:13px;color:#6B6A5E;">
      This code expires in <strong>10 minutes</strong>. If you didn't create a Stampworks account,
      you can safely ignore this email.
    </p>
  `;

  return {
    subject: 'Verify your Stampworks email',
    text: `Hi ${name}, your verification code is ${otp}. This code expires in 10 minutes.`,
    html: emailLayout({
      title: 'Verify your email',
      preheader: `Your verification code is ${otp}`,
      bodyHtml,
    }),
  };
}

module.exports = otpTemplate;
