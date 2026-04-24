const express = require('express');
const { getDb } = require('../db');
const { authenticate, requireRole, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/workers
router.get('/', optionalAuth, (req, res) => {
  try {
    const db = getDb();
    const { category, rating, available, search, sort, limit, offset } = req.query;

    let query = 'SELECT * FROM workers WHERE status = ?';
    const params = ['active'];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (rating) { query += ' AND rating >= ?'; params.push(parseFloat(rating)); }
    if (available !== undefined) { query += ' AND available = ?'; params.push(available === 'true' ? 1 : 0); }
    if (search) {
      query += ' AND (name LIKE ? OR category LIKE ? OR skills LIKE ?)';
      const s = `%${search}%`; params.push(s, s, s);
    }

    switch (sort) {
      case 'rating': query += ' ORDER BY rating DESC'; break;
      case 'experience': query += ' ORDER BY experience DESC'; break;
      case 'price_low': query += ' ORDER BY price_min ASC'; break;
      case 'price_high': query += ' ORDER BY price_max DESC'; break;
      default: query += ' ORDER BY rating DESC, completed_jobs DESC';
    }

    const lim = parseInt(limit) || 50;
    const off = parseInt(offset) || 0;
    query += ` LIMIT ${lim} OFFSET ${off}`;

    const workers = db.queryAll(query, params).map(w => ({
      ...w,
      skills: JSON.parse(w.skills || '[]'),
      languages: JSON.parse(w.languages || '["English"]'),
      verified: !!w.verified,
      available: !!w.available,
      priceRange: { min: w.price_min, max: w.price_max, unit: w.price_unit },
      location: { lat: w.lat, lng: w.lng, area: w.area, city: w.city },
      distance: +(Math.random() * 10).toFixed(1),
    }));

    res.json({ workers, total: workers.length, limit: lim, offset: off });
  } catch (err) {
    console.error('List workers error:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET /api/workers/:id
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const worker = db.queryOne('SELECT * FROM workers WHERE id = ? AND status = ?', [req.params.id, 'active']);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const reviews = db.queryAll(
      'SELECT r.*, u.name as customer_name FROM reviews r JOIN users u ON r.customer_id = u.id WHERE r.worker_id = ? ORDER BY r.created_at DESC LIMIT 20',
      [req.params.id]
    );

    res.json({
      worker: {
        ...worker,
        skills: JSON.parse(worker.skills || '[]'),
        languages: JSON.parse(worker.languages || '["English"]'),
        verified: !!worker.verified, available: !!worker.available,
        priceRange: { min: worker.price_min, max: worker.price_max, unit: worker.price_unit },
        location: { lat: worker.lat, lng: worker.lng, area: worker.area, city: worker.city },
      },
      reviews,
    });
  } catch (err) {
    console.error('Get worker error:', err);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// PUT /api/workers/:id
router.put('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const worker = db.queryOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    if (req.user.role !== 'admin' && worker.user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

    const { name, phone, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, available, avatar } = req.body;

    db.run(`UPDATE workers SET
      name = COALESCE(?, name), phone = COALESCE(?, phone), category = COALESCE(?, category),
      skills = COALESCE(?, skills), experience = COALESCE(?, experience), bio = COALESCE(?, bio),
      price_min = COALESCE(?, price_min), price_max = COALESCE(?, price_max), price_unit = COALESCE(?, price_unit),
      area = COALESCE(?, area), city = COALESCE(?, city), languages = COALESCE(?, languages),
      available = COALESCE(?, available), avatar = COALESCE(?, avatar), updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name||null, phone||null, category||null, skills?JSON.stringify(skills):null, experience!=null?experience:null,
       bio||null, price_min||null, price_max||null, price_unit||null, area||null, city||null,
       languages?JSON.stringify(languages):null, available!=null?(available?1:0):null, avatar||null, req.params.id]);

    const updated = db.queryOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    res.json({ worker: { ...updated, skills: JSON.parse(updated.skills||'[]'), languages: JSON.parse(updated.languages||'["English"]'), verified: !!updated.verified, available: !!updated.available } });
  } catch (err) {
    console.error('Update worker error:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// POST /api/workers/apply
router.post('/apply', (req, res) => {
  try {
    const { name, email, phone, password, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, photo_url, id_proof_type, id_proof_number } = req.body;
    if (!name || !email || !phone || !password || !category || !id_proof_type || !id_proof_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = getDb();
    const bcrypt = require('bcryptjs');
    const existing = db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const existingApp = db.queryOne("SELECT id FROM worker_applications WHERE email = ? AND status = 'pending'", [email]);
    if (existingApp) return res.status(409).json({ error: 'Application already pending' });

    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.run(
      'INSERT INTO worker_applications (name, email, phone, password, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, photo_url, id_proof_type, id_proof_number) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [name, email, phone, hashedPassword, category, JSON.stringify(skills||[]), experience||0, bio||'', price_min||300, price_max||800, price_unit||'per hour', area||'', city||'Hyderabad', JSON.stringify(languages||['English']), photo_url||null, id_proof_type, id_proof_number]
    );

    res.status(201).json({ message: 'Application submitted successfully.', applicationId: result.lastInsertRowid });
  } catch (err) {
    console.error('Worker apply error:', err);
    res.status(500).json({ error: 'Application submission failed' });
  }
});

module.exports = router;
