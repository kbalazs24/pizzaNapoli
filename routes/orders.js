const express = require("express");
const pool = require("../db/connection");
const router = express.Router();
async function saveOrder(connection, customer, orderItems, total, paymentMethod, userId) {
  const [result] = await connection.query(
    `INSERT INTO orders (user_id, customer_name, customer_email, customer_phone,
      delivery_postal_code, delivery_city, delivery_street_address,
      order_note, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [userId, customer.name.trim(), customer.email.trim(), customer.phone.trim(),
      customer.postalCode.trim(), customer.city.trim(), customer.streetAddress.trim(),
      typeof customer.notes === "string" ? customer.notes.trim() : null, total]
  );

  const orderId = result.insertId;
  for (const item of orderItems) {
    await connection.query(
      "INSERT INTO order_items (order_id, pizza_id, pizza_name, quantity, unit_price) VALUES (?, ?, ?, ?, ?)",
      [orderId, item.pizzaId, item.name, item.quantity, item.price]
    );
  }

  await connection.query(
    "INSERT INTO payments (order_id, method, amount, paid_at) VALUES (?, ?, ?, CASE WHEN ? = 'online_card' THEN NOW() ELSE NULL END)",
    [orderId, paymentMethod, total, paymentMethod]
  );
  return orderId;
}

router.post("/", async (req, res) => {
  const { customer, items, paymentMethod } = req.body || {};
  const methods = ["cash", "card_on_delivery", "online_card"];
  if (!methods.includes(paymentMethod)) {
    return res.status(400).json({ error: "Please select a payment method." });
  }
  const fields = ["name", "email", "phone", "postalCode", "city", "streetAddress"];

  if (!customer || fields.some(field => typeof customer[field] !== "string" || !customer[field].trim())) {
    return res.status(400).json({ error: "Please fill in all required fields." });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Your cart is empty." });
  }
  for (const item of items) {
    if (!item || !Number.isInteger(item.pizzaId) || item.pizzaId < 1 ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
      return res.status(400).json({ error: "Invalid cart item." });
    }
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const [pizzas] = await connection.query("SELECT id, name, price FROM pizzas WHERE id = ?", [item.pizzaId]);
      if (!pizzas.length) {
        await connection.rollback();
        return res.status(400).json({ error: "Pizza not found." });
      }
      const pizza = pizzas[0];
      total += pizza.price * item.quantity;
      orderItems.push({ pizzaId: pizza.id, name: pizza.name, quantity: item.quantity, price: pizza.price });
    }

    if (!Number.isSafeInteger(total) || total > 2147483647) {
      await connection.rollback();
      return res.status(400).json({ error: "Invalid order total." });
    }

    if (paymentMethod === "online_card") {
      await connection.commit();
      req.session.checkout = { customer, orderItems, total, userId: req.session.userId || null };
      return res.json({ total, onlinePayment: true });
    }

    delete req.session.checkout;
    const orderId = await saveOrder(connection, customer, orderItems, total, paymentMethod, req.session.userId || null);

    const resultBody = { message: "Order placed successfully.", orderId, total };
    await connection.commit();
    res.status(201).json(resultBody);
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (rollbackError) { console.error("Rollback error:", rollbackError); }
    }
    console.error("Order error:", error);
    res.status(500).json({ error: "Could not save order." });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
module.exports.saveOrder = saveOrder;
