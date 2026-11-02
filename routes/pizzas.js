const express = require("express");
const pool = require("../db/connection");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [pizzas] = await pool.query("SELECT id, name, description, ingredients, price, image_path FROM pizzas ORDER BY id");
    res.json(pizzas);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Failed to load pizzas." });
  }
});

router.get("/:id", async (req, res) => {
  const pizzaId = Number(req.params.id);
  if (!Number.isSafeInteger(pizzaId) || pizzaId < 1) {
    return res.status(400).json({ error: "Invalid pizza ID." });
  }
  try {
    const [pizzas] = await pool.query("SELECT * FROM pizzas WHERE id = ?", [pizzaId]);
    if (!pizzas.length) return res.status(404).json({ error: "Pizza not found." });
    res.json(pizzas[0]);
  } catch (error) {
    console.error("Database error:", error);
    res.status(500).json({ error: "Database error." });
  }
});

module.exports = router;
