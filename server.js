require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const pool = require("./db/connection");

if (!process.env.SESSION_SECRET) {
  console.error("SESSION_SECRET is missing from the .env file.");
  process.exit(1);
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", application: "PIZZA NAPOLI" });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/addresses", require("./routes/addresses"));
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