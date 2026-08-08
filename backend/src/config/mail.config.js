const axios = require('axios');
const { BREVO_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME } = require('../config/env.js');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

function isConfigured() {
  return Boolean(BREVO_API_KEY && EMAIL_FROM);
}

function getDefaultFrom() {
  return {
    email: EMAIL_FROM || 'onboarding@yourdomain.com',
    name: EMAIL_FROM_NAME || 'Stampworks',
  };
}

// Call once at server boot. Brevo has no persistent connection to verify
// like SMTP does, so this checks the API key is valid via a cheap,
// harmless account-info call.
async function verifyConnection() {
  if (!isConfigured()) {
    console.log('[Mail] No BREVO_API_KEY/EMAIL_FROM configured — sends will be logged to console only.');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const { data } = await axios.get('https://api.brevo.com/v3/account', {
      headers: { 'api-key': BREVO_API_KEY },
    });
    console.log(`[Mail] Brevo API key verified (account: ${data.email}). Sending from: ${getDefaultFrom().email}`);
    return { ok: true };
  } catch (err) {
    const reason = err.response?.data?.message || err.message;
    console.error('[Mail] Brevo verification FAILED.');
    console.error(`[Mail] Reason: ${reason}`);
    console.error('[Mail] Emails will fail to send until this is fixed. Common causes: invalid API key, or sender not verified.');
    return { ok: false, reason };
  }
}

async function sendMail({ to, subject, html, text, from }) {
  if (!isConfigured()) {
    console.log(`[Mail] (not configured) Would send to ${to}: "${subject}"`);
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const { data } = await axios.post(
      BREVO_API_URL,
      {
        sender: from || getDefaultFrom(),
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      },
      {
        headers: {
          'api-key': BREVO_API_KEY,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );
    return { ok: true, messageId: data.messageId };
  } catch (err) {
    const reason = err.response?.data?.message || err.message;
    console.error(`[Mail] Failed to send to ${to}:`, reason);
    return { ok: false, reason };
  }
}

module.exports = { isConfigured, getDefaultFrom, verifyConnection, sendMail };