const express = require("express");
const db = require("../config/db");

const router = express.Router();

// ✅ ROUTE: GET /api/totals/
router.get("/", async (req, res) => {
  try {
    const [[bookCount]] = await db.query("SELECT COUNT(*) AS total_books FROM books");
    const [[userCount]] = await db.query("SELECT COUNT(*) AS total_users FROM users");
    const [[downloadCount]] = await db.query("SELECT COUNT(*) AS total_downloads FROM downloads");
    const [[readCount]] = await db.query("SELECT COUNT(*) AS total_reads FROM book_reads");

    res.json({
      total_books: bookCount.total_books,
      total_users: userCount.total_users,
      total_downloads: downloadCount.total_downloads,
      total_reads: readCount.total_reads
    });
  } catch (err) {
    console.error("Totals Error:", err);
    res.status(500).json({ message: "Failed to fetch totals" });
  }
});

module.exports = router;
