const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'kaamwala.db');

let db = null;
let dbReady = null;

// Save database to disk
function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

// Auto-save every 5 seconds
setInterval(() => { try { saveDb(); } catch(e) {} }, 5000);

// Initialize sql.js and load/create database
async function initializeDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('📂 Loaded existing database');
  } else {
    db = new SQL.Database();
    console.log('📂 Created new database');
  }

  db.run('PRAGMA foreign_keys = ON');

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer','worker','admin')),
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workers table
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      category TEXT NOT NULL,
      skills TEXT DEFAULT '[]',
      experience INTEGER DEFAULT 0,
      bio TEXT DEFAULT '',
      price_min INTEGER DEFAULT 300,
      price_max INTEGER DEFAULT 800,
      price_unit TEXT DEFAULT 'per hour',
      area TEXT DEFAULT '',
      city TEXT DEFAULT 'Hyderabad',
      lat REAL DEFAULT 17.3850,
      lng REAL DEFAULT 78.4867,
      languages TEXT DEFAULT '["English"]',
      avatar TEXT,
      verified INTEGER DEFAULT 0,
      available INTEGER DEFAULT 1,
      rating REAL DEFAULT 0,
      reviews_count INTEGER DEFAULT 0,
      completed_jobs INTEGER DEFAULT 0,
      id_proof_type TEXT,
      id_proof_number TEXT,
      id_proof_file TEXT,
      status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Worker applications
  db.run(`
    CREATE TABLE IF NOT EXISTS worker_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      category TEXT NOT NULL,
      skills TEXT DEFAULT '[]',
      experience INTEGER DEFAULT 0,
      bio TEXT DEFAULT '',
      price_min INTEGER DEFAULT 300,
      price_max INTEGER DEFAULT 800,
      price_unit TEXT DEFAULT 'per hour',
      area TEXT DEFAULT '',
      city TEXT DEFAULT 'Hyderabad',
      languages TEXT DEFAULT '["English"]',
      photo_url TEXT,
      id_proof_type TEXT NOT NULL,
      id_proof_number TEXT NOT NULL,
      id_proof_file TEXT,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME
    )
  `);

  // Categories
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      name_hi TEXT,
      name_te TEXT,
      name_ta TEXT
    )
  `);

  // Bookings
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      worker_id INTEGER NOT NULL,
      category TEXT,
      description TEXT,
      address TEXT,
      date TEXT,
      time TEXT,
      estimated_price INTEGER DEFAULT 0,
      final_price INTEGER,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','accepted','in_progress','completed','cancelled')),
      customer_rating INTEGER,
      customer_review TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id)
    )
  `);

  // Reviews
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER UNIQUE,
      worker_id INTEGER NOT NULL,
      customer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      text TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (worker_id) REFERENCES workers(id),
      FOREIGN KEY (customer_id) REFERENCES users(id)
    )
  `);

  // Seed categories
  const categories = [
    ['plumber', 'Plumber', '🔧', '#3b82f6', 'प्लंबर', 'ప్లంబర్', 'குழாய்த்தொழிலாளி'],
    ['electrician', 'Electrician', '⚡', '#f59e0b', 'इलेक्ट्रीशियन', 'ఎలక్ట్రీషియన్', 'மின்சாரத் தொழிலாளி'],
    ['painter', 'Painter', '🎨', '#8b5cf6', 'पेंटर', 'పెయింటర్', 'ஓவியர்'],
    ['carpenter', 'Carpenter', '🪚', '#a16207', 'बढ़ई', 'వడ్లవాడు', 'தச்சர்'],
    ['construction', 'Construction', '🏗️', '#dc2626', 'निर्माण', 'నిర్మాణం', 'கட்டுமானம்'],
    ['cleaner', 'Cleaner', '🧹', '#10b981', 'सफाई', 'శుభ్రం', 'சுத்தம்'],
    ['ac_repair', 'AC Repair', '❄️', '#06b6d4', 'एसी रिपेयर', 'AC రిపేర్', 'ஏசி பழுது'],
    ['appliance', 'Appliance Repair', '🔌', '#6366f1', 'उपकरण मरम्मत', 'ఉపకరణ రిపేర్', 'சாதன பழுது'],
  ];
  for (const cat of categories) {
    db.run('INSERT OR IGNORE INTO categories (id, name, icon, color, name_hi, name_te, name_ta) VALUES (?, ?, ?, ?, ?, ?, ?)', cat);
  }

  // Seed admin user
  const adminCheck = db.exec("SELECT id FROM users WHERE role = 'admin'");
  if (adminCheck.length === 0 || adminCheck[0].values.length === 0) {
    const hashedPw = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@123', 10);
    db.run('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)',
      ['Admin', process.env.ADMIN_EMAIL || 'admin@kaamwala.com', '+91 00000 00000', hashedPw, 'admin']);
    console.log('✅ Admin user created: admin@kaamwala.com / Admin@123');
  }

  // Seed demo workers
  const workerCount = db.exec('SELECT COUNT(*) as count FROM workers');
  const count = workerCount[0]?.values[0]?.[0] || 0;
  if (count === 0) {
    // No demo workers seeded
  }

  saveDb();
  console.log('✅ Database initialized');
}

// Helper: Run a query that returns rows
function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

// Helper: Run a query that returns one row
function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows[0] || null;
}

// Helper: Run an INSERT/UPDATE/DELETE
function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  return {
    lastInsertRowid: queryOne('SELECT last_insert_rowid() as id')?.id,
    changes: queryOne('SELECT changes() as count')?.count,
  };
}

function getDb() {
  return { queryAll, queryOne, run: runSql };
}

module.exports = { getDb, initializeDatabase };
