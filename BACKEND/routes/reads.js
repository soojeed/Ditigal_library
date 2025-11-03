const express = require("express");
const db = require("../config/db"); // ✅ CommonJS syntax

const router = express.Router();

// GET all reads
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM book_reads ORDER BY read_date DESC");
    res.json(rows);
  } catch (err) {
    console.error("Reads Error:", err);
    res.status(500).json({ message: "Failed to fetch reads" });
  }
});

module.exports = router;
