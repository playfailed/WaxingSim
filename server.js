import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 8080;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// STATIC FILES
// -----------------------------

// JSON files
const BEEQUIPS_DIR = path.join(__dirname, 'backend', 'beequips');
app.use('/beequips', express.static(BEEQUIPS_DIR));

fs.readdir(BEEQUIPS_DIR, (err, files) => {
  if (err) {
    console.error('Error reading beequips folder:', err);
  } else {
    console.log('Files in /beequips folder:');
    files.forEach(f => console.log(' -', f));
  }
});

// Frontend
const FRONTEND_DIR = path.join(__dirname, 'Frontend');
app.use(express.static(FRONTEND_DIR));

// -----------------------------
// ROUTES
// -----------------------------

app.get('*', (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// -----------------------------
// START SERVER
// -----------------------------

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
