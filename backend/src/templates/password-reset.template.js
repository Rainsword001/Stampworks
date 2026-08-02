function passwordResetTemplate({ resetUrl }) {
  return {
    subject: 'Reset your Stampworks password',
    text: `Reset your password using this link (valid for 1 hour): ${resetUrl}`,
    html: `
      <p>Hello,</p>
      <p>You requested to reset your password.</p>
      <p><a href="${resetUrl}">Reset your password</a></p>
      <p>This link expires in <strong>1 hour</strong>.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  };
}

module.exports = passwordResetTemplate;
