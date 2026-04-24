const express = require('express');
const { getDb } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// POST /api/bookings
router.post('/', authenticate, (req, res) => {
  try {
    const { worker_id, description, address, date, time, estimated_price, payment_method } = req.body;
    if (!worker_id) return res.status(400).json({ error: 'worker_id is required' });

    const db = getDb();
    const worker = db.queryOne('SELECT * FROM workers WHERE id = ? AND status = ?', [worker_id, 'active']);
    if (!worker) return res.status(404).json({ error: 'Worker not found' });

    const result = db.run(
      'INSERT INTO bookings (customer_id, worker_id, category, description, address, date, time, estimated_price, payment_method) VALUES (?,?,?,?,?,?,?,?,?)',
      [req.user.id, worker_id, worker.category, description||'', address||'', date||'', time||'', estimated_price || Math.round((worker.price_min+worker.price_max)/2), payment_method||'cash']
    );

    const booking = db.queryOne('SELECT * FROM bookings WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ booking });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// GET /api/bookings
router.get('/', authenticate, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query, params;

    if (req.user.role === 'admin') {
      query = 'SELECT b.*, w.name as worker_name, w.category, u.name as customer_name FROM bookings b JOIN workers w ON b.worker_id = w.id JOIN users u ON b.customer_id = u.id';
      params = [];
    } else if (req.user.role === 'worker') {
      const worker = db.queryOne('SELECT id FROM workers WHERE user_id = ?', [req.user.id]);
      if (!worker) return res.json({ bookings: [] });
      query = 'SELECT b.*, w.name as worker_name, w.category, u.name as customer_name FROM bookings b JOIN workers w ON b.worker_id = w.id JOIN users u ON b.customer_id = u.id WHERE b.worker_id = ?';
      params = [worker.id];
    } else {
      query = 'SELECT b.*, w.name as worker_name, w.category FROM bookings b JOIN workers w ON b.worker_id = w.id WHERE b.customer_id = ?';
      params = [req.user.id];
    }

    if (status) {
      query += params.length ? ' AND b.status = ?' : ' WHERE b.status = ?';
      params.push(status);
    }
    query += ' ORDER BY b.created_at DESC';

    const bookings = db.queryAll(query, params);
    res.json({ bookings });
  } catch (err) {
    console.error('List bookings error:', err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/bookings/:id
router.get('/:id', authenticate, (req, res) => {
  try {
    const db = getDb();
    const booking = db.queryOne(
      'SELECT b.*, w.name as worker_name, w.category, w.phone as worker_phone, u.name as customer_name, u.phone as customer_phone FROM bookings b JOIN workers w ON b.worker_id = w.id JOIN users u ON b.customer_id = u.id WHERE b.id = ?',
      [req.params.id]
    );
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json({ booking });
  } catch (err) {
    console.error('Get booking error:', err);
    res.status(500).json({ error: 'Failed to fetch booking' });
  }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', authenticate, (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['accepted', 'in_progress', 'completed', 'cancelled'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const db = getDb();
    const booking = db.queryOne('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    db.run('UPDATE bookings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, req.params.id]);
    if (status === 'completed') {
      db.run('UPDATE workers SET completed_jobs = completed_jobs + 1 WHERE id = ?', [booking.worker_id]);
    }

    const updated = db.queryOne('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    res.json({ booking: updated });
  } catch (err) {
    console.error('Update booking status error:', err);
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// POST /api/bookings/:id/review
router.post('/:id/review', authenticate, (req, res) => {
  try {
    const { rating, text } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    const db = getDb();
    const booking = db.queryOne('SELECT * FROM bookings WHERE id = ? AND customer_id = ?', [req.params.id, req.user.id]);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ error: 'Can only review completed bookings' });

    const existing = db.queryOne('SELECT id FROM reviews WHERE booking_id = ?', [req.params.id]);
    if (existing) return res.status(409).json({ error: 'Already reviewed' });

    db.run('INSERT INTO reviews (booking_id, worker_id, customer_id, rating, text) VALUES (?,?,?,?,?)',
      [req.params.id, booking.worker_id, req.user.id, rating, text||'']);

    const stats = db.queryOne('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE worker_id = ?', [booking.worker_id]);
    db.run('UPDATE workers SET rating = ?, reviews_count = ? WHERE id = ?',
      [Math.round(stats.avg_rating * 10) / 10, stats.count, booking.worker_id]);

    db.run('UPDATE bookings SET customer_rating = ?, customer_review = ? WHERE id = ?', [rating, text||'', req.params.id]);
    res.status(201).json({ message: 'Review submitted' });
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
