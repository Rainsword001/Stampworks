const escapeHtml = require('../utils/escapeHtml');

function welcomeTemplate({ name, role }) {
  const safeName = escapeHtml(name);
  const roleMessage = role === 'artisan'
    ? 'You can now list your trade and start receiving booking requests from customers nearby.'
    : 'You can now search for verified local tradespeople and send booking requests.';

  return {
    subject: 'Welcome to Stampworks',
    text: `Hi ${name}, your email is verified and your Stampworks account is ready. ${roleMessage}`,
    html: `
      <h2>Welcome to Stampworks 👋</h2>
      <p>Hello <strong>${safeName}</strong>,</p>
      <p>Your email is verified and your account is ready. ${roleMessage}</p>
    `,
  };
}

module.exports = welcomeTemplate;
