import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import os from 'os';

// Resolve directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
// Explicitly set to 8087 per request
const PORT = 8087;
const DB_FILE = path.join(__dirname, 'omnipds.sqlite');

// Middleware to handle large SQLite binary blobs (up to 50MB)
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));

// Serve static assets from the current directory
app.use(express.static(__dirname));

/**
 * Client Environment Injection
 * Serves the API Key to the frontend securely via an auto-loaded script.
 */
app.get('/env.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: "${key}" } };`);
});

/**
 * Sovereign Core Health Check
 * Provides hardware diagnostics and database status.
 */
app.get('/api/health', (req, res) => {
  const memUsed = process.memoryUsage();
  res.json({
    status: 'online',
    core: 'OmniPDS 1.2.5',
    storage: {
      exists: fs.existsSync(DB_FILE),
      size: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0
    },
    ai: {
      active: !!process.env.API_KEY,
      engine: 'gemini-3-pro-preview'
    },
    system: {
      platform: os.platform(),
      cpus: os.cpus().length,
      freeMem: os.freemem(),
      totalMem: os.totalmem(),
      load: os.loadavg()
    },
    process: {
      uptime: process.uptime(),
      memory: memUsed.rss
    }
  });
});

/**
 * PDS Data Retrieval
 * Streams the SQLite database binary to the client.
 */
app.get('/api/pds/load', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: 'Sovereign ledger not yet initialized.' });
  }
});

/**
 * PDS Data Persistence
 * Receives the raw binary export from sql.js and commits it to disk.
 */
app.post('/api/pds/persist', (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      throw new Error("Persistence failed: Binary stream is empty.");
    }
    fs.writeFileSync(DB_FILE, req.body);
    console.log(`[OmniPDS] Committed ledger update: ${req.body.length} bytes`);
    res.sendStatus(200);
  } catch (e) {
    console.error('[OmniPDS] Critical Save Error:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * SPA Catch-All
 * Routes all remaining traffic to index.html while ignoring /api and /env.js.
 */
app.get(/^(?!\/api|\/env\.js).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize Sovereign Node
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         OMNIPDS SOVEREIGN CORE v1.2          ║
  ╠══════════════════════════════════════════════╣
  ║ PORT: ${PORT}                                   ║
  ║ STATUS: ONLINE                               ║
  ║ STORAGE: ${DB_FILE}          ║
  ║ AI GATEWAY: ${process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}                     ║
  ╚══════════════════════════════════════════════╝
  Local Node: http://localhost:${PORT}
  `);
});

// Error handling for occupied ports
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is occupied. Kill the other process or check .env.local.`);
  } else {
    console.error('[FATAL] System Error:', err);
  }
  process.exit(1);
});