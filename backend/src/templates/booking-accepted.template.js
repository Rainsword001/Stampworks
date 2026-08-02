const escapeHtml = require('../utils/escapeHtml');

function bookingAcceptedTemplate({ customerName, artisanName }) {
  const safeCustomerName = escapeHtml(customerName);
  const safeArtisanName = escapeHtml(artisanName);

  return {
    subject: 'Your Stampworks booking was accepted',
    text: `Hi ${customerName}, ${artisanName} accepted your booking request. Log in to see their contact details.`,
    html: `
      <h2>Your booking was accepted 🎉</h2>
      <p>Hello <strong>${safeCustomerName}</strong>,</p>
      <p><strong>${safeArtisanName}</strong> accepted your booking request.</p>
      <p>Log in to Stampworks to see their contact details.</p>
    `,
  };
}

module.exports = bookingAcceptedTemplate;
