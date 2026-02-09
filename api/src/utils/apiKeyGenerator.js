const crypto = require('crypto');

/**
 * Generate a secure API key
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate a secure API secret
 */
function generateApiSecret() {
  return crypto.randomBytes(64).toString('hex');
}

module.exports = {
  generateApiKey,
  generateApiSecret
};
