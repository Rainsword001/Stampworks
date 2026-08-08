const escapeHtml = require('../utils/escapeHtml');
const emailLayout = require('./layout');
const { button, quoteBlock, pill } = require('./components');

function bookingRequestTemplate({ artisanName, customerName, message, appUrl }) {
  const safeArtisanName = escapeHtml(artisanName);
  const safeCustomerName = escapeHtml(customerName);
  const safeMessage = escapeHtml(message);

  const bodyHtml = `
    <div style="margin-bottom:10px;">${pill('New request', '#C17A3D')}</div>
    <h2 style="margin:0 0 4px;font-size:20px;color:#1F2421;">You've got a booking request</h2>
    <p style="margin:0;">Hello <strong>${safeArtisanName}</strong>, <strong>${safeCustomerName}</strong> sent you a request:</p>
    ${quoteBlock(safeMessage)}
    <p style="margin:0;">Log in to accept or decline it.</p>
    ${appUrl ? button('View request', appUrl) : ''}
  `;

  return {
    subject: 'New booking request on Stampworks',
    text: `Hi ${artisanName}, ${customerName} sent you a booking request: "${message}". Log in to accept or decline it.`,
    html: emailLayout({
      title: 'New booking request',
      preheader: `${customerName} sent you a booking request`,
      bodyHtml,
    }),
  };
}

module.exports = bookingRequestTemplate;
