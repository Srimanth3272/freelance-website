require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) return cb(null, true);
    cb(new Error('Only images and PDFs are allowed'));
  }
});

// Upload endpoints
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});
app.post('/api/upload/photo', upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No photo uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});
app.post('/api/upload/idproof', upload.single('idproof'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// Categories (public)
app.get('/api/categories', (req, res) => {
  const { getDb } = require('./db');
  const db = getDb();
  const categories = db.queryAll('SELECT * FROM categories');
  res.json({ categories });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'KaamWala API', version: '1.0.0', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err instanceof multer.MulterError) return res.status(400).json({ error: `Upload error: ${err.message}` });
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server with async DB init
async function start() {
  const { initializeDatabase } = require('./db');
  await initializeDatabase();

  // Mount routes AFTER db is ready
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/workers', require('./routes/workers'));
  app.use('/api/bookings', require('./routes/bookings'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/ai', require('./routes/ai'));

  app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║                                          ║
  ║   🏠 KaamWala Backend API                ║
  ║   🚀 Running on http://localhost:${PORT}    ║
  ║   📊 Health: /api/health                  ║
  ║                                          ║
  ║   Admin Login:                           ║
  ║   📧 admin@kaamwala.com                  ║
  ║   🔒 Admin@123                           ║
  ║                                          ║
  ╚══════════════════════════════════════════╝
    `);
  });
}

start().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
