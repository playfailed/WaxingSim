import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = 8080;

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------
// STATIC FILES
// -----------------------------

// Serve JSON files in backend/beequips
app.use('/beequips', express.static(path.join(__dirname, 'beequips')));

// Serve frontend
app.use(express.static(path.join(__dirname, '../Frontend')));

// -----------------------------
// ROUTES
// -----------------------------

// Catch-all → SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// -----------------------------
// START SERVER (ONLY ONCE)
// -----------------------------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
