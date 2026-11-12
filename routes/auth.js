const express = require("express");
const pool = require("../db/connection");
const requireAuth = require("../middleware/require-auth");
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

function validateProfile({ name, email, phone }) {
  if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
    return { error: "Please enter your full name." };
  }
  if (typeof email !== "string" || email.length > 255 || !EMAIL_PATTERN.test(email.trim())) {
    return { error: "Please enter a valid email address." };
  }
  if (phone !== undefined && phone !== null && (typeof phone !== "string" || phone.trim().length > 30)) {
    return { error: "Invalid phone number." };
  }
  return {
    value: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: typeof phone === "string" && phone.trim() ? phone.trim() : null
    }
  };
}

async function findUserById(userId) {
  const [users] = await pool.query(
    "SELECT id, name, email, phone, role FROM users WHERE id = ?",
    [userId]
  );
  return users[0] || null;
}

router.post("/register", async (req, res) => {
  const body = req.body || {};
  const profile = validateProfile(body);
  if (profile.error) {
    return res.status(400).json({ error: profile.error });
  }
  if (typeof body.password !== "string" || body.password.length < 8 || body.password.length > 128) {
    return res.status(400).json({ error: "Password must be 8-128 characters long." });
  }

  const { name, email, phone } = profile.value;

  try {
    const passwordHash = await hashPassword(body.password);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, phone) VALUES (?, ?, ?, ?)",
      [name, email, passwordHash, phone]
    );

    await startSession(req, result.insertId);
    res.status(201).json({ user: await findUserById(result.insertId) });
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
      "SELECT id, password_hash FROM users WHERE email = ?",
      [email.trim().toLowerCase()]
    );
    const user = users[0];
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false;

    if (!passwordOk) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    await startSession(req, user.id);
    res.json({ user: await findUserById(user.id) });
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

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await findUserById(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Please log in." });
    }
    res.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Could not load user." });
  }
});

router.put("/me", requireAuth, async (req, res) => {
  const profile = validateProfile(req.body || {});
  if (profile.error) {
    return res.status(400).json({ error: profile.error });
  }

  const { name, email, phone } = profile.value;

  try {
    await pool.query(
      "UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?",
      [name, email, phone, req.session.userId]
    );
    res.json({ user: await findUserById(req.session.userId) });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    console.error("Profile update error:", error);
    res.status(500).json({ error: "Could not save changes." });
  }
});

module.exports = router;