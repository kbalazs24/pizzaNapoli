const express = require("express");
const pool = require("../db/connection");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT o.id, o.created_at AS createdAt, o.total_price AS totalPrice,
              o.delivery_postal_code AS postalCode, o.delivery_city AS city,
              o.delivery_street_address AS streetAddress,
              i.pizza_name AS pizzaName, i.quantity, i.unit_price AS unitPrice
       FROM orders o
       JOIN order_items i ON i.order_id = o.id
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC, o.id DESC, i.id`,
      [req.session.userId]
    );

    const orders = [];
    const ordersById = new Map();
    for (const row of rows) {
      let order = ordersById.get(row.id);
      if (!order) {
        order = {
          id: row.id,
          createdAt: row.createdAt,
          totalPrice: row.totalPrice,
          address: `${row.postalCode} ${row.city}, ${row.streetAddress}`,
          items: []
        };
        ordersById.set(row.id, order);
        orders.push(order);
      }
      order.items.push({ pizzaName: row.pizzaName, quantity: row.quantity, unitPrice: row.unitPrice });
    }

    res.json({ orders });
  } catch (error) {
    console.error("Order history error:", error);
    res.status(500).json({ error: "Could not load your orders." });
  }
});

module.exports = router;