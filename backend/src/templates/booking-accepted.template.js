const escapeHtml = require('../utils/escapeHtml');
const emailLayout = require('./layout');
const { button, pill } = require('./components');

function bookingAcceptedTemplate({ customerName, artisanName, appUrl }) {
  const safeCustomerName = escapeHtml(customerName);
  const safeArtisanName = escapeHtml(artisanName);

  const bodyHtml = `
    <div style="margin-bottom:10px;">${pill('Accepted', '#5C8A7A')}</div>
    <h2 style="margin:0 0 4px;font-size:20px;color:#1F2421;">Your booking was accepted 🎉</h2>
    <p style="margin:0;">Hello <strong>${safeCustomerName}</strong>,</p>
    <p style="margin:0;"><strong>${safeArtisanName}</strong> accepted your booking request.</p>
    <p style="margin:0;">Log in to Stampworks to see their contact details.</p>
    ${appUrl ? button('View contact details', appUrl) : ''}
  `;

  return {
    subject: 'Your Stampworks booking was accepted',
    text: `Hi ${customerName}, ${artisanName} accepted your booking request. Log in to see their contact details.`,
    html: emailLayout({
      title: 'Booking accepted',
      preheader: `${artisanName} accepted your booking`,
      bodyHtml,
    }),
  };
}

module.exports = bookingAcceptedTemplate;
