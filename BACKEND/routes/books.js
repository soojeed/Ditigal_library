const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ==== Multer Config ====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, 'uploads/files');
    else cb(null, 'uploads/images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ✅ CREATE Book
router.post('/', verifyToken, upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
  try {
    const { title, author, description } = req.body;
    const file_url = req.files.file ? `/uploads/files/${req.files.file[0].filename}` : null;
    const image_url = req.files.image ? `/uploads/images/${req.files.image[0].filename}` : null;

    const [result] = await pool.query(
      'INSERT INTO books (title, author, description, file_url, image_url) VALUES (?, ?, ?, ?, ?)',
      [title, author, description, file_url, image_url]
    );

    res.status(201).json({ message: 'Book added ✅', book_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add book' });
  }
});

// ✅ READ All Books
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books ');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ READ One Book
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ UPDATE Book
router.put('/:id', verifyToken, upload.fields([{ name: 'file' }, { name: 'image' }]), async (req, res) => {
  try {
    const { title, author, description } = req.body;
    let file_url = null;
    let image_url = null;

    if (req.files.file) file_url = `/uploads/files/${req.files.file[0].filename}`;
    if (req.files.image) image_url = `/uploads/images/${req.files.image[0].filename}`;

    const [oldRows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (oldRows.length === 0) return res.status(404).json({ message: 'Book not found' });

    const oldBook = oldRows[0];

    if (file_url && oldBook.file_url) fs.unlink(path.join(__dirname, '..', oldBook.file_url), () => {});
    if (image_url && oldBook.image_url) fs.unlink(path.join(__dirname, '..', oldBook.image_url), () => {});

    await pool.query(
      'UPDATE books SET title=?, author=?, description=?, file_url=IFNULL(?, file_url), image_url=IFNULL(?, image_url) WHERE id=?',
      [title, author, description, file_url, image_url, req.params.id]
    );

    res.json({ message: 'Book updated ✅' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ✅ DELETE Book
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Book not found' });

    const book = rows[0];
    if (book.file_url) fs.unlink(path.join(__dirname, '..', book.file_url), () => {});
    if (book.image_url) fs.unlink(path.join(__dirname, '..', book.image_url), () => {});

    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ View / Read Book
router.get('/view/:id', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await pool.query('SELECT * FROM books WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Book not found' });

    const book = rows[0];
    const filePath = path.join(__dirname, '..', book.file_url);

    await pool.query('INSERT INTO book_reads (user_id, book_id) VALUES (?, ?)', [userId, book.id]);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

    res.sendFile(filePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Download Book
router.get('/download/:id', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: 'No token provided' });

    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await pool.query('SELECT * FROM books WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Book not found' });

    const book = rows[0];
    const filePath = path.join(__dirname, '..', book.file_url);

    await pool.query('INSERT INTO downloads (user_id, book_id) VALUES (?, ?)', [userId, book.id]);

    if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'File not found' });

    res.download(filePath, `${book.title}.pdf`);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ REPORT BOOK READS & DOWNLOADS
router.get('/report/:id', verifyToken, async (req, res) => {
  try {
    const bookId = req.params.id;
    const [book] = await pool.query(`SELECT title, author FROM books WHERE id = ?`, [bookId]);
    if (book.length === 0) return res.status(404).json({ message: 'Book not found' });

    const [reads] = await pool.query(`
      SELECT read_id, user_id, read_date 
      FROM book_reads 
      WHERE book_id = ?
      ORDER BY read_date DESC
    `, [bookId]);

    const [downloads] = await pool.query(`
      SELECT download_id, user_id, download_date 
      FROM downloads 
      WHERE book_id = ?
      ORDER BY download_date DESC
    `, [bookId]);

    const userIds = [...new Set([...reads.map(r => r.user_id), ...downloads.map(d => d.user_id)])];
    let usersMap = {};
    if (userIds.length > 0) {
      const [users] = await pool.query(`SELECT id, name FROM users WHERE id IN (?)`, [userIds]);
      usersMap = Object.fromEntries(users.map(u => [u.id, u.name]));
    }

    const readsData = reads.map(r => ({
      ...r,
      name: usersMap[r.user_id] || `User #${r.user_id}`
    }));
    const downloadsData = downloads.map(d => ({
      ...d,
      name: usersMap[d.user_id] || `User #${d.user_id}`
    }));

    res.json({
      book: book[0],
      totalReads: readsData.length,
      totalDownloads: downloadsData.length,
      reads: readsData,
      downloads: downloadsData
    });

  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: 'Failed to generate report' });
  }
});

// ✅ GET all reads (NO JOIN)
router.get("/reads", async (req, res) => {
  try {
    const [reads] = await db.query("SELECT * FROM book_reads ORDER BY read_date DESC");
    res.json(reads);
  } catch (err) {
    console.error("Reads Error:", err);
    res.status(500).json({ message: "Failed to fetch reads" });
  }
});


// ✅ GET all downloads (NO JOIN)
router.get("/downloads", async (req, res) => {
  try {
    const [downloads] = await db.query("SELECT * FROM downloads ORDER BY download_date DESC");
    res.json(downloads);
  } catch (err) {
    console.error("Downloads Error:", err);
    res.status(500).json({ message: "Failed to fetch downloads" });
  }
});


module.exports = router;
