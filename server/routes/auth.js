const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Store OTPs temporarily in memory for verification
const otpStore = {};

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const db = getDb();
    const existing = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      [name, email, phone || null, hashedPassword, 'customer']);

    const token = generateToken(result.lastInsertRowid);
    const user = db.queryOne('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const db = getDb();
    const user = db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

    const token = generateToken(user.id);
    const { password: _, ...userData } = user;
    res.json({ token, user: userData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/login/phone
router.post('/login/phone', (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    // Step 2: Verify OTP
    if (otp) {
      if (!otpStore[phone] || otpStore[phone].code !== otp) {
        return res.status(401).json({ error: 'Invalid or expired OTP' });
      }
      // OTP is valid! Check expiration (e.g. 5 mins)
      if (Date.now() - otpStore[phone].createdAt > 5 * 60 * 1000) {
        delete otpStore[phone];
        return res.status(401).json({ error: 'OTP has expired' });
      }
      // Valid & not expired, delete it so it can't be reused
      delete otpStore[phone];

      const db = getDb();
      let user = db.queryOne('SELECT * FROM users WHERE phone = ?', [phone]);
      if (!user) {
        const hashedPw = bcrypt.hashSync('otp_' + phone, 10);
        const result = db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
          ['User', `${phone.replace(/\D/g, '')}@kaamwala.app`, phone, hashedPw, 'customer']);
        user = db.queryOne('SELECT * FROM users WHERE id = ?', [result.lastInsertRowid]);
      }
      const token = generateToken(user.id);
      const { password: _, ...userData } = user;
      return res.json({ token, user: userData, verified: true });
    }

    // Step 1: Generate and Send OTP
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    otpStore[phone] = {
      code: generatedOtp,
      createdAt: Date.now()
    };
    
    // Simulate confidential SMS sending by securely logging to standard stream
    console.log(`\n=========================================`);
    console.log(`📱 SMS SIMULATION FOR: +91 ${phone}`);
    console.log(`🔐 Your KaamWala verification OTP is: ${generatedOtp}`);
    console.log(`=========================================\n`);

    res.json({ message: 'OTP sent successfully', otpSent: true, mockOtpMessage: generatedOtp });
  } catch (err) {
    console.error('Phone login error:', err);
    res.status(500).json({ error: 'Phone login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const db = getDb();
  const user = db.queryOne('SELECT id, name, email, phone, role, avatar, created_at FROM users WHERE id = ?', [req.user.id]);
  if (user.role === 'worker') {
    const wp = db.queryOne('SELECT * FROM workers WHERE user_id = ?', [user.id]);
    if (wp) {
      user.workerProfile = { ...wp, skills: JSON.parse(wp.skills || '[]'), languages: JSON.parse(wp.languages || '["English"]') };
    }
  }
  res.json({ user });
});

// PUT /api/auth/me
router.put('/me', authenticate, (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const db = getDb();
    db.run('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name || null, phone || null, avatar || null, req.user.id]);
    const user = db.queryOne('SELECT id, name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Update failed' });
  }
});

module.exports = router;
