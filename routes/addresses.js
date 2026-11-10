const express = require("express");
const pool = require("../db/connection");
const requireAuth = require("../middleware/require-auth");

const router = express.Router();
router.use(requireAuth);

function validateAddress({ postalCode, city, streetAddress }) {
  const fields = [
    [postalCode, 10, "Please enter a valid postal code."],
    [city, 100, "Please enter the city."],
    [streetAddress, 255, "Please enter the street address."]
  ];
  for (const [value, maxLength, message] of fields) {
    if (typeof value !== "string" || !value.trim() || value.trim().length > maxLength) {
      return { error: message };
    }
  }
  return {
    value: { postalCode: postalCode.trim(), city: city.trim(), streetAddress: streetAddress.trim() }
  };
}

function parseId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function listAddresses(db, userId) {
  const [rows] = await db.query(
    `SELECT id, postal_code AS postalCode, city, street_address AS streetAddress, is_default AS isDefault
     FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id`,
    [userId]
  );
  return rows.map(row => ({ ...row, isDefault: Boolean(row.isDefault) }));
}

async function findOwnedAddress(db, addressId, userId) {
  const [rows] = await db.query(
    "SELECT id, is_default AS isDefault FROM addresses WHERE id = ? AND user_id = ? FOR UPDATE",
    [addressId, userId]
  );
  return rows[0] || null;
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

router.get("/", async (req, res) => {
  try {
    res.json({ addresses: await listAddresses(pool, req.session.userId) });
  } catch (error) {
    console.error("Address list error:", error);
    res.status(500).json({ error: "Could not load addresses." });
  }
});

router.post("/", async (req, res) => {
  const address = validateAddress(req.body || {});
  if (address.error) {
    return res.status(400).json({ error: address.error });
  }

  const userId = req.session.userId;
  const { postalCode, city, streetAddress } = address.value;

  try {
    const addresses = await withTransaction(async db => {
      const [[{ count }]] = await db.query(
        "SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?",
        [userId]
      );
      const makeDefault = count === 0 || req.body.isDefault === true;
      if (makeDefault) {
        await db.query("UPDATE addresses SET is_default = FALSE WHERE user_id = ?", [userId]);
      }
      await db.query(
        "INSERT INTO addresses (user_id, postal_code, city, street_address, is_default) VALUES (?, ?, ?, ?, ?)",
        [userId, postalCode, city, streetAddress, makeDefault]
      );
      return listAddresses(db, userId);
    });
    res.status(201).json({ addresses });
  } catch (error) {
    console.error("Address create error:", error);
    res.status(500).json({ error: "Could not save address." });
  }
});

router.put("/:id", async (req, res) => {
  const addressId = parseId(req.params.id);
  const address = validateAddress(req.body || {});
  if (!addressId) {
    return res.status(400).json({ error: "Invalid address ID." });
  }
  if (address.error) {
    return res.status(400).json({ error: address.error });
  }

  const userId = req.session.userId;
  const { postalCode, city, streetAddress } = address.value;

  try {
    const addresses = await withTransaction(async db => {
      if (!await findOwnedAddress(db, addressId, userId)) return null;

      await db.query(
        "UPDATE addresses SET postal_code = ?, city = ?, street_address = ? WHERE id = ?",
        [postalCode, city, streetAddress, addressId]
      );
      if (req.body.isDefault === true) {
        await db.query("UPDATE addresses SET is_default = (id = ?) WHERE user_id = ?", [addressId, userId]);
      }
      return listAddresses(db, userId);
    });

    if (!addresses) {
      return res.status(404).json({ error: "Address not found." });
    }
    res.json({ addresses });
  } catch (error) {
    console.error("Address update error:", error);
    res.status(500).json({ error: "Could not update address." });
  }
});

router.delete("/:id", async (req, res) => {
  const addressId = parseId(req.params.id);
  if (!addressId) {
    return res.status(400).json({ error: "Invalid address ID." });
  }

  const userId = req.session.userId;

  try {
    const addresses = await withTransaction(async db => {
      const existing = await findOwnedAddress(db, addressId, userId);
      if (!existing) return null;

      await db.query("DELETE FROM addresses WHERE id = ?", [addressId]);
      if (existing.isDefault) {
        await db.query(
          "UPDATE addresses SET is_default = TRUE WHERE user_id = ? ORDER BY id LIMIT 1",
          [userId]
        );
      }
      return listAddresses(db, userId);
    });

    if (!addresses) {
      return res.status(404).json({ error: "Address not found." });
    }
    res.json({ addresses });
  } catch (error) {
    console.error("Address delete error:", error);
    res.status(500).json({ error: "Could not delete address." });
  }
});

module.exports = router;