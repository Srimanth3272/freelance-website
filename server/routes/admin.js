const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats
router.get('/stats', (req, res) => {
  try {
    const db = getDb();
    const totalWorkers = db.queryOne('SELECT COUNT(*) as count FROM workers')?.count || 0;
    const verifiedWorkers = db.queryOne('SELECT COUNT(*) as count FROM workers WHERE verified = 1')?.count || 0;
    const pendingApps = db.queryOne("SELECT COUNT(*) as count FROM worker_applications WHERE status = 'pending'")?.count || 0;
    const totalBookings = db.queryOne('SELECT COUNT(*) as count FROM bookings')?.count || 0;
    const totalRevenue = db.queryOne("SELECT COALESCE(SUM(estimated_price), 0) as total FROM bookings WHERE status = 'completed'")?.total || 0;
    const totalUsers = db.queryOne("SELECT COUNT(*) as count FROM users WHERE role = 'customer'")?.count || 0;
    const activeWorkers = db.queryOne("SELECT COUNT(*) as count FROM workers WHERE available = 1 AND status = 'active'")?.count || 0;

    res.json({ stats: { totalWorkers, verifiedWorkers, pendingApps, totalBookings, totalRevenue, totalUsers, activeWorkers } });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/workers
router.get('/workers', (req, res) => {
  try {
    const db = getDb();
    const { search, category } = req.query;
    let query = 'SELECT * FROM workers WHERE 1=1';
    const params = [];

    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; const s = `%${search}%`; params.push(s, s); }
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY created_at DESC';

    const workers = db.queryAll(query, params).map(w => ({
      ...w, skills: JSON.parse(w.skills||'[]'), languages: JSON.parse(w.languages||'["English"]'), verified: !!w.verified, available: !!w.available,
    }));
    res.json({ workers });
  } catch (err) {
    console.error('Admin list workers error:', err);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// POST /api/admin/workers
router.post('/workers', (req, res) => {
  try {
    const { name, phone, email, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, avatar } = req.body;
    if (!name || !category) return res.status(400).json({ error: 'Name and category required' });

    const db = getDb();
    const result = db.run(
      'INSERT INTO workers (name, phone, email, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, avatar, verified) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)',
      [name, phone||'', email||'', category, JSON.stringify(skills||[]), experience||0, bio||'', price_min||300, price_max||800, price_unit||'per hour', area||'', city||'Hyderabad', JSON.stringify(languages||['English']), avatar||null]
    );

    const worker = db.queryOne('SELECT * FROM workers WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ worker: { ...worker, skills: JSON.parse(worker.skills||'[]'), languages: JSON.parse(worker.languages||'["English"]'), verified: !!worker.verified, available: !!worker.available } });
  } catch (err) {
    console.error('Admin add worker error:', err);
    res.status(500).json({ error: 'Failed to add worker' });
  }
});

// PUT /api/admin/workers/:id
router.put('/workers/:id', (req, res) => {
  try {
    const db = getDb();
    const worker = db.queryOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const { name, phone, email, category, skills, experience, bio, price_min, price_max, area, city, languages, available, verified, status } = req.body;

    db.run(`UPDATE workers SET name=COALESCE(?,name), phone=COALESCE(?,phone), email=COALESCE(?,email), category=COALESCE(?,category), skills=COALESCE(?,skills), experience=COALESCE(?,experience), bio=COALESCE(?,bio), price_min=COALESCE(?,price_min), price_max=COALESCE(?,price_max), area=COALESCE(?,area), city=COALESCE(?,city), languages=COALESCE(?,languages), available=COALESCE(?,available), verified=COALESCE(?,verified), status=COALESCE(?,status), updated_at=CURRENT_TIMESTAMP WHERE id=?`,
      [name||null, phone||null, email||null, category||null, skills?JSON.stringify(skills):null, experience!=null?experience:null, bio||null, price_min||null, price_max||null, area||null, city||null, languages?JSON.stringify(languages):null, available!=null?(available?1:0):null, verified!=null?(verified?1:0):null, status||null, req.params.id]);

    const updated = db.queryOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    res.json({ worker: { ...updated, skills: JSON.parse(updated.skills||'[]'), languages: JSON.parse(updated.languages||'["English"]'), verified: !!updated.verified, available: !!updated.available } });
  } catch (err) {
    console.error('Admin update worker error:', err);
    res.status(500).json({ error: 'Failed to update worker' });
  }
});

// DELETE /api/admin/workers/:id
router.delete('/workers/:id', (req, res) => {
  try {
    const db = getDb();
    const worker = db.queryOne('SELECT * FROM workers WHERE id = ?', [req.params.id]);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });
    db.run('DELETE FROM workers WHERE id = ?', [req.params.id]);
    res.json({ message: 'Worker deleted successfully' });
  } catch (err) {
    console.error('Admin delete worker error:', err);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

// GET /api/admin/applications
router.get('/applications', (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = 'SELECT * FROM worker_applications';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';

    const applications = db.queryAll(query, params).map(a => ({ ...a, skills: JSON.parse(a.skills||'[]'), languages: JSON.parse(a.languages||'["English"]') }));
    res.json({ applications });
  } catch (err) {
    console.error('Admin list applications error:', err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// PUT /api/admin/applications/:id/approve
router.put('/applications/:id/approve', (req, res) => {
  try {
    const db = getDb();
    const app = db.queryOne('SELECT * FROM worker_applications WHERE id = ?', [req.params.id]);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    let userId;
    const existingUser = db.queryOne('SELECT id FROM users WHERE email = ?', [app.email]);
    if (existingUser) {
      userId = existingUser.id;
      db.run("UPDATE users SET role = 'worker' WHERE id = ?", [userId]);
    } else {
      const result = db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?,?,?,?,?)', [app.name, app.email, app.phone, app.password, 'worker']);
      userId = result.lastInsertRowid;
    }

    db.run('INSERT INTO workers (user_id, name, phone, email, category, skills, experience, bio, price_min, price_max, price_unit, area, city, languages, avatar, verified, id_proof_type, id_proof_number) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)',
      [userId, app.name, app.phone, app.email, app.category, app.skills, app.experience, app.bio, app.price_min, app.price_max, app.price_unit, app.area, app.city, app.languages, app.photo_url, app.id_proof_type, app.id_proof_number]);

    db.run("UPDATE worker_applications SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);
    res.json({ message: 'Application approved. Worker account created.' });
  } catch (err) {
    console.error('Approve application error:', err);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// PUT /api/admin/applications/:id/reject
router.put('/applications/:id/reject', (req, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const app = db.queryOne('SELECT * FROM worker_applications WHERE id = ?', [req.params.id]);
    if (!app) return res.status(404).json({ error: 'Application not found' });
    if (app.status !== 'pending') return res.status(400).json({ error: 'Already processed' });

    db.run("UPDATE worker_applications SET status = 'rejected', rejection_reason = ?, reviewed_at = CURRENT_TIMESTAMP WHERE id = ?", [reason||'', req.params.id]);
    res.json({ message: 'Application rejected' });
  } catch (err) {
    console.error('Reject application error:', err);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// GET /api/admin/bookings
router.get('/bookings', (req, res) => {
  try {
    const db = getDb();
    const bookings = db.queryAll('SELECT b.*, w.name as worker_name, w.category, u.name as customer_name FROM bookings b JOIN workers w ON b.worker_id = w.id JOIN users u ON b.customer_id = u.id ORDER BY b.created_at DESC');
    res.json({ bookings });
  } catch (err) {
    console.error('Admin list bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
