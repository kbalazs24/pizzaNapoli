require("dotenv").config();

const express = require("express");
const path = require("path");
const pool = require("./db/connection");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
    res.json({ status: "ok", application: "PIZZA NAPOLI" });
});

app.get("/api/pizzas", async (req, res) => {
    try {
        const [pizzas] = await pool.query(
            "SELECT id, name, description, ingredients, price, image_path FROM pizzas ORDER BY id"
        );

        res.json(pizzas);
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Failed to load pizzas." });
    }
});

app.get("/api/pizzas/:id", async (req, res) => {
    try {
        const pizzaId = Number(req.params.id);
        if (!Number.isSafeInteger(pizzaId) || pizzaId < 1) {
            return res.status(400).json({ error: "Invalid pizza ID" });
        }
        const [pizzas] = await pool.query("SELECT * FROM pizzas WHERE id = ?", [pizzaId]);
        if (pizzas.length === 0) {
            return res.status(404).json({ error: "Pizza not found" });
        }
        res.json(pizzas[0]);
    } catch (error) {
        console.error("Could not load pizza:", error);
        res.status(500).json({ error: "Database error" });
    }
});


async function startServer() {
    try {
        await pool.query("SELECT 1");

        app.listen(PORT, () => {
            console.log(`PIZZA NAPOLI: http://localhost:${PORT}`);
            console.log("MySQL connection successful.");
        });
    } catch (error) {
        console.error("MySQL connection failed:", error.message);
        process.exit(1);
    }
}

startServer();
