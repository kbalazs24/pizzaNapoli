const express = require("express");
const pool = require("../db/connection");
const { hashPassword } = require("../utils/password");

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function startSession(req, userId) {
  return new Promise((resolve, reject) => {
    req.session.regenerate(error => {
      if (error) return reject(error);
      req.session.userId = userId;
      resolve();
    });
  });
}

router.post("/register", async (req, res) => {
  const { name, email, phone, password } = req.body || {};

  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    return res.status(400).json({ error: "Please enter your full name." });
  }
  if (typeof email !== "string" || email.length > 255 || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: "Password must be 8-128 characters long." });
  }
  if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.trim().length > 30)) {
    return res.status(400).json({ error: "Invalid phone number." });
  }

  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = typeof phone === "string" && phone.trim() ? phone.trim() : null;

  try {
    const passwordHash = await hashPassword(password);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
      [cleanName, cleanEmail, passwordHash, cleanPhone]
    );

    await startSession(req, result.insertId);
    res.status(201).json({
      user: { id: result.insertId, name: cleanName, email: cleanEmail, phone: cleanPhone, role: "customer" }
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    console.error("Register error:", error);
    res.status(500).json({ error: "Could not create account." });
  }
});

module.exports = router;