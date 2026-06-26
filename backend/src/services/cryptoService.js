const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes)');
  }
  return Buffer.from(keyHex.slice(0, 64), 'hex');
}

function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(ciphertext) {
  const key = getKey();
  const data = Buffer.from(ciphertext, 'base64');

  const iv = data.slice(0, IV_LENGTH);
  const tag = data.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.slice(IV_LENGTH + TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString('utf8');
}

function generateSecureToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

module.exports = { encrypt, decrypt, generateSecureToken };
