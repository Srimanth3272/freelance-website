const fs = require('fs');

const files = [
  'src/pages/WorkerSignupPage.jsx',
  'src/pages/WorkerDashboardPage.jsx',
  'src/pages/HomePage.jsx',
  'src/pages/AdminDashboard.jsx',
  'src/context/AppContext.jsx',
  'server/routes/workers.js',
  'server/routes/admin.js',
  'server/db.js'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/Hyderabad/g, 'Tirupati');
    content = content.replace(/Delhi & Bangalore/g, 'Chittoor & Nellore');
    fs.writeFileSync(file, content);
  }
}
console.log("Replacement complete.");
