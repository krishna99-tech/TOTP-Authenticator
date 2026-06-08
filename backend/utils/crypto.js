const crypto = require('crypto');

const ITERATIONS = 10000;
const KEYLEN = 64;
const DIGEST = 'sha512';

async function hash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(`${salt}:${key.toString('hex')}`);
    });
  });
}

async function compare(password, stored) {
  const [salt, storedKey] = stored.split(':');
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex') === storedKey);
    });
  });
}

module.exports = { hash, compare };
