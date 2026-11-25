const express = require("express");
const pool = require("../db/connection");
const router = express.Router();
const { saveOrder } = require("./orders");
const processing = new Set();

router.get("/demo", (req, res) => {
  res.set("Cache-Control", "no-store");
  const checkout = req.session.checkout;
  if (!checkout || checkout.userId !== (req.session.userId || null)) {
    return res.status(404).json({ error: "No active online payment in this session." });
  }
  res.json({ amount: checkout.total });
});

router.post("/demo", async (req, res) => {
  const { cardNumber, expiry, cvc } = req.body || {};
  const checkout = req.session.checkout;
  if (!checkout || checkout.userId !== (req.session.userId || null)) {
    return res.status(404).json({ error: "No active online payment in this session." });
  }

  const number = typeof cardNumber === "string" ? cardNumber.replaceAll(" ", "") : "";

  if (!/^\d{16}$/.test(number)) {
    return res.status(400).json({ error: "Enter a 16-digit card number." });
  }
  if (typeof expiry !== "string" || !/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
    return res.status(400).json({ error: "Enter the expiry date in MM/YY format." });
  }
  if (typeof cvc !== "string" || !/^\d{3}$/.test(cvc)) {
    return res.status(400).json({ error: "Enter a 3-digit CVC." });
  }

  if (number !== "4242424242424242" || expiry !== "12/30" || cvc !== "123") {
    return res.json({ success: false });
  }

  if (processing.has(req.sessionID)) {
    return res.status(409).json({ error: "Payment is already being processed." });
  }
  processing.add(req.sessionID);
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    const orderId = await saveOrder(connection, checkout.customer, checkout.orderItems, checkout.total, "online_card", checkout.userId);
    await connection.commit();
    delete req.session.checkout;
    await new Promise((resolve, reject) => {
      req.session.save(error => error ? reject(error) : resolve());
    });
    res.json({ success: true, orderId });
  } catch (error) {
    if (connection) {
      try { await connection.rollback(); } catch (rollbackError) { console.error("Rollback error:", rollbackError); }
    }
    console.error("Demo payment error:", error);
    res.status(500).json({ error: "Could not process payment." });
  } finally {
    if (connection) connection.release();
    processing.delete(req.sessionID);
  }
});

module.exports = router;
