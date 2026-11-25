const express = require("express");
const pool = require("../db/connection");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [areas] = await pool.query("SELECT city, delivery_fee FROM delivery_areas ORDER BY city");
    res.json(areas);
  } catch (error) {
    console.error("Delivery areas error:", error);
    res.status(500).json({ error: "Could not load delivery areas." });
  }
});

module.exports = router;
