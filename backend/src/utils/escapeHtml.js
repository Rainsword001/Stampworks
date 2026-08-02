// Used by every email template before interpolating user-supplied strings
// (names, booking messages) into HTML. Without this, a booking message
// containing markup would render as live HTML in the recipient's inbox.
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = escapeHtml;
