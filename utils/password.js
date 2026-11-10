const crypto = require("crypto");
const { promisify } = require("util");

const scrypt = promisify(crypto.scrypt);
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, KEY_LENGTH);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, storedValue) {
  const [salt, hashHex] = String(storedValue).split(":");
  if (!salt || !hashHex) return false;
  const storedHash = Buffer.from(hashHex, "hex");
  const hash = await scrypt(password, salt, storedHash.length);
  return crypto.timingSafeEqual(hash, storedHash);
}

module.exports = { hashPassword, verifyPassword };