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

app.use("/api/pizzas", require("./routes/pizzas"));
app.use("/api/orders", require("./routes/orders"));

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
