const escapeHtml = require('../utils/escapeHtml');
const emailLayout = require('./layout');
const { button } = require('./components');

function welcomeTemplate({ name, role, appUrl }) {
  const safeName = escapeHtml(name);
  const roleMessage = role === 'artisan'
    ? 'You can now list your trade and start receiving booking requests from customers nearby.'
    : 'You can now search for verified local tradespeople and send booking requests.';

  const bodyHtml = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1F2421;">Welcome to Stampworks 🎉</h2>
    <p style="margin:0 0 4px;">Hello <strong>${safeName}</strong>,</p>
    <p style="margin:0;">Your email is verified and your account is ready. ${roleMessage}</p>
    ${appUrl ? button(role === 'artisan' ? 'List your trade' : 'Browse artisans', appUrl) : ''}
  `;

  return {
    subject: 'Welcome to Stampworks',
    text: `Hi ${name}, your email is verified and your Stampworks account is ready. ${roleMessage}`,
    html: emailLayout({
      title: 'Welcome to Stampworks',
      preheader: 'Your account is verified and ready to go',
      bodyHtml,
    }),
  };
}

module.exports = welcomeTemplate;
