const express = require("express");
const pool = require("../db/connection");
const { hashPassword, verifyPassword } = require("../utils/password");

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

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (typeof email !== "string" || typeof password !== "string" || !email.trim() || !password) {
    return res.status(400).json({ error: "Please enter your email and password." });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role, password_hash FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    const user = users[0];
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;

    if (!passwordOk) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    await startSession(req, user.id);
    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Could not log in." });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy(error => {
    if (error) {
      console.error("Logout error:", error);
      return res.status(500).json({ error: "Could not log out." });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Logged out." });
  });
});

router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not logged in." });
  }

  try {
    const [users] = await pool.query(
      "SELECT id, name, email, phone, role FROM users WHERE id = ?",
      [req.session.userId]
    );
    if (!users.length) {
      return res.status(401).json({ error: "Not logged in." });
    }
    res.json({ user: users[0] });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Could not load user." });
  }
});

module.exports = router;