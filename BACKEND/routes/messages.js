const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth'); // ✅ verifyToken import

// ✅ POST /api/messages → user sends message (must be logged in)
router.post('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id; // from token
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get user info from DB (optional)
    const [user] = await pool.query('SELECT name, email FROM users WHERE id=?', [userId]);
    const name = user[0]?.name || 'Unknown';
    const email = user[0]?.email || 'unknown@example.com';

    await pool.query(
      'INSERT INTO messages (user_id, name, email, message) VALUES (?, ?, ?, ?)',
      [userId, name, email, message]
    );

    res.json({ message: '✅ Message sent successfully' });
  } catch (err) {
    console.error('Message Error:', err);
    res.status(500).json({ message: '❌ Server error' });
  }
});

// ✅ GET /api/messages → Admin view all messages
router.get('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const [rows] = await pool.query(
      'SELECT m.*, u.name AS username FROM messages m LEFT JOIN users u ON m.user_id = u.id ORDER BY m.id DESC'
    );
    res.json(rows);
  } catch (err) {
    console.error('Fetch Error:', err);
    res.status(500).json({ message: '❌ Error fetching messages' });
  }
});

// ✅ PUT /api/messages/:id/reply → Admin reply
router.put('/:id/reply', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const { reply } = req.body;
    if (!reply) return res.status(400).json({ message: 'Reply text required' });

    await pool.query('UPDATE messages SET reply=? WHERE id=?', [reply, req.params.id]);
    res.json({ message: '✅ Reply saved' });
  } catch (err) {
    console.error('Reply Error:', err);
    res.status(500).json({ message: '❌ Error saving reply' });
  }
});

// ✅ GET /api/messages/user → Logged-in user’s messages only
router.get('/user', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.query(
      'SELECT * FROM messages WHERE user_id = ? ORDER BY id DESC',
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('User Fetch Error:', err);
    res.status(500).json({ message: '❌ Error fetching your messages' });
  }
});

// ✅ DELETE /api/messages/:id → Admin delete message
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    // kaliya admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: Admins only' });
    }

    const messageId = req.params.id;
    const [result] = await pool.query('DELETE FROM messages WHERE id = ?', [messageId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: '🗑️ Message deleted successfully' });
  } catch (err) {
    console.error('Delete Error:', err);
    res.status(500).json({ message: '❌ Error deleting message' });
  }
});


module.exports = router;
