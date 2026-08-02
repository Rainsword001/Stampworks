const escapeHtml = require('../utils/escapeHtml');

function bookingRequestTemplate({ artisanName, customerName, message }) {
  const safeArtisanName = escapeHtml(artisanName);
  const safeCustomerName = escapeHtml(customerName);
  const safeMessage = escapeHtml(message);

  return {
    subject: 'New booking request on Stampworks',
    text: `Hi ${artisanName}, ${customerName} sent you a booking request: "${message}". Log in to accept or decline it.`,
    html: `
      <h2>New booking request</h2>
      <p>Hello <strong>${safeArtisanName}</strong>,</p>
      <p><strong>${safeCustomerName}</strong> sent you a booking request:</p>
      <blockquote>${safeMessage}</blockquote>
      <p>Log in to Stampworks to accept or decline it.</p>
    `,
  };
}

module.exports = bookingRequestTemplate;
