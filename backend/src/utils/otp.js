const crypto = require('crypto');


function generateOtp() {
  return crypto.randomInt(100000, 999999).toString();
}

function hashSecret(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

module.exports = { generateOtp, hashSecret };
