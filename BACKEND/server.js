const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const mysql = require('mysql2/promise');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');
const adminRoutes = require('./routes/admin');
const path = require('path');
const messageRoutes = require('./routes/messages');
const readsRoutes = require('./routes/reads');
const downloadsRoutes = require('./routes/downloads');
const totalsRoutes = require("./routes/totals");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/reads', readsRoutes);
app.use("/api/downloads", downloadsRoutes);
app.use("/api/totals", totalsRoutes);
// app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
// app.use('/uploads/files', express.static(path.join(__dirname, 'uploads/files')));



(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'digital_library'
    });
    console.log('✅ Database connected successfully');
    await conn.end();
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

app.get('/', (req, res) => {
  res.send('Digital Library Backend is running!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
