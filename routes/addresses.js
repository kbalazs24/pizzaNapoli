const express = require("express");
const pool = require("../db/connection");
const requireAuth = require("../middleware/require-auth");
const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT delivery_postal_code AS postalCode, delivery_city AS city, delivery_street_address AS streetAddress FROM users WHERE id = ?",
      [req.session.userId]
    );
    if (!rows.length) return res.status(401).json({ error: "Please log in." });
    res.json({ address: rows[0] });
  } catch (error) {
    console.error("Address error:", error);
    res.status(500).json({ error: "Could not load address." });
  }
});

router.put("/", async (req, res) => {
  const { postalCode, city, streetAddress } = req.body || {};
  const fields = [[postalCode, 10], [city, 100], [streetAddress, 255]];
  if (fields.some(([value, max]) => typeof value !== "string" || !value.trim() || value.trim().length > max)) {
    return res.status(400).json({ error: "Please enter a valid address." });
  }
  try {
    const [result] = await pool.query(
      "UPDATE users SET delivery_postal_code = ?, delivery_city = ?, delivery_street_address = ? WHERE id = ?",
      [postalCode.trim(), city.trim(), streetAddress.trim(), req.session.userId]
    );
    if (!result.affectedRows) return res.status(401).json({ error: "Please log in." });
    res.json({ address: { postalCode: postalCode.trim(), city: city.trim(), streetAddress: streetAddress.trim() } });
  } catch (error) {
    console.error("Address error:", error);
    res.status(500).json({ error: "Could not save address." });
  }
});

module.exports = router;
