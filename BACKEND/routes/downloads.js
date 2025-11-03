const express = require("express");
const db = require("../config/db");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM downloads ORDER BY download_date DESC");
    res.json(rows);
  } catch (err) {
    console.error("Downloads Error:", err);
    res.status(500).json({ message: "Failed to fetch downloads" });
  }
});

module.exports = router;
