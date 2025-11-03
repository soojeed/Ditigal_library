const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

const router = express.Router();

// REGISTER user
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    // Check existing user
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'User already exists' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [
      name,
      email,
      hashed,
      role || 'user'
    ]);

    res.json({ message: 'User registered successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
const { verifyToken } = require('../middleware/auth'); // hubi inaad middleware-kan haysato

// GET all users
router.get('/', verifyToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE user role or name or email (Admin Only)
router.put('/:id', verifyToken,  async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
      [name, email, role, id]
    );

    res.json({ message: 'User updated successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE user by ID (Admin Only)
router.delete('/:id', verifyToken,  async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted successfully ✅' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret123',
      { expiresIn: '2h' }
    );

    res.json({ message: 'Login successful ✅', token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
