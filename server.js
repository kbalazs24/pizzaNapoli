require("dotenv").config();
const express = require("express");
const path = require("path");
const app = express();
const PORT = Number(process.env.PORT) || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", application: "PIZZA NAPOLI" });
});
app.listen(PORT, () => {
    console.log(`PIZZA NAPOLI: http://localhost:${PORT}`);
});
