const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Report: Total downloads per book
router.get('/report', verifyToken, isAdmin, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.id, b.title, COUNT(d.id) AS downloads
      FROM books b
      LEFT JOIN downloads d ON b.id = d.book_id
      GROUP BY b.id, b.title
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;