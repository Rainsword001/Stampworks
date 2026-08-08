const emailLayout = require('./layout');
const { button } = require('./components');

function passwordResetTemplate({ resetUrl }) {
  const bodyHtml = `
    <h2 style="margin:0 0 4px;font-size:20px;color:#1F2421;">Reset your password</h2>
    <p style="margin:0;">You requested to reset your Stampworks password. Click below to choose a new one:</p>
    ${button('Reset password', resetUrl)}
    <p style="margin:0;font-size:13px;color:#6B6A5E;">
      This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email
      — your password won't be changed.
    </p>
  `;

  return {
    subject: 'Reset your Stampworks password',
    text: `Reset your password using this link (valid for 1 hour): ${resetUrl}`,
    html: emailLayout({
      title: 'Reset your password',
      preheader: 'Reset your Stampworks password',
      bodyHtml,
    }),
  };
}

module.exports = passwordResetTemplate;
