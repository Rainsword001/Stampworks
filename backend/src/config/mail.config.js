
const nodemailer = require('nodemailer');
const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = require('../config/env.js');

function isConfigured() {
  return Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

let transporter;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT ,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Without these, an unreachable/slow host hangs on Nodemailer's
      // defaults (multiple minutes) — and since password-reset awaits the
      // send directly in the request handler, that would hang the HTTP
      // response too. Fail fast instead.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

function getDefaultFrom() {
  return EMAIL_FROM || `"Stampworks" <${SMTP_USER}>`;
}

// Call once at server boot (see server.js). Purely diagnostic — logs
// whether SMTP is reachable so misconfiguration is visible immediately
// instead of surfacing as "nobody got an email" days later. Never called
// again per-send: if verification passes at boot, subsequent sends just
// attempt sendMail() directly and report their own success/failure —
// re-verifying on every send would make a failing SMTP host slower with
// every attempt instead of failing fast.
async function verifyConnection() {
  if (!isConfigured()) {
    console.log('[Mail] No SMTP configured — sends will be logged to console only.');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    await getTransporter().verify();
    console.log(`[Mail] SMTP connection verified (${SMTP_HOST}:${SMTP_PORT}, user: ${SMTP_USER}). Ready to send.`);
    return { ok: true };
  } catch (err) {
    console.error(`[Mail] SMTP connection FAILED (${SMTP_HOST}:${SMTP_PORT || 587}, user: ${SMTP_USER}).`);
    console.error(`[Mail] Reason: ${err.message}`);
    console.error('[Mail] Emails will fail to send until this is fixed. Common causes: wrong password/app-password, wrong port, unverified sender/domain with your provider, or the host blocking the connection.');
    return { ok: false, reason: err.message };
  }
}

module.exports = { isConfigured, getTransporter, getDefaultFrom, verifyConnection };
