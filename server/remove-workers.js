const { initializeDatabase, getDb } = require('./db');

(async () => {
  await initializeDatabase();
  const db = getDb();
  
  db.run("DELETE FROM reviews");
  db.run("DELETE FROM bookings");
  db.run("DELETE FROM workers");
  db.run("DELETE FROM worker_applications");
  
  console.log("✅ All demo workers, bookings, and reviews removed from database");
  process.exit(0);
})();
