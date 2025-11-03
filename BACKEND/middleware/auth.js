const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify token
// function verifyToken(req, res, next) {
//   const header = req.headers['authorization'];
//    token = req.query.token; // ✅ oggolow token ka yimaada URL query string
//   if (!header) return res.status(401).json({ message: 'No token provided' });

//   const token = header.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'Invalid token' });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
//     req.user = decoded;
//     next();
//   } catch (err) {
//     res.status(403).json({ message: 'Token invalid or expired' });
//   }
// }
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token) {
    token = req.query.token; // ✅ oggolow token ka yimaada URL query string
  }

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
}


// Only admin
function isAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only' });
  next();
}

module.exports = { verifyToken, isAdmin };
