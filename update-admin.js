const { initializeDatabase, getDb } = require('./server/db');
const bcrypt = require('bcryptjs');

(async () => {
  await initializeDatabase();
  const db = getDb();
  const hashedPw = bcrypt.hashSync('srimanth@3272', 10);
  db.run("UPDATE users SET email = 'srimanth', password = ? WHERE role = 'admin'", [hashedPw]);
  console.log("✅ Admin credentials updated to Username: srimanth / Password: srimanth@3272");
  process.exit(0);
})();
