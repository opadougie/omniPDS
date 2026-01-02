
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import os from 'os';

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
// Port explicitly set to 8087 as requested
const PORT = process.env.PORT || 8087;
const DB_FILE = path.join(__dirname, 'omnipds.sqlite');

// Middleware: Handle large binary SQLite exports (up to 50MB)
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.static(__dirname));

/**
 * SECURE ENVIRONMENT INJECTION
 * Injects the API_KEY into the client-side scope via window.process.env.
 */
app.get('/env.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: "${process.env.API_KEY || ''}" } };`);
});

/**
 * SYSTEM DIAGNOSTICS
 * Returns hardware, process, and storage health metrics.
 */
app.get('/api/health', (req, res) => {
  const memUsed = process.memoryUsage();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    storage: {
      path: DB_FILE,
      exists: fs.existsSync(DB_FILE),
      size: fs.existsSync(DB_FILE) ? fs.statSync(DB_FILE).size : 0
    },
    ai: {
      active: !!process.env.API_KEY,
      model: 'gemini-3-pro-preview'
    },
    system: {
      platform: os.platform(),
      release: os.release(),
      uptime: os.uptime(),
      load: os.loadavg(),
      cpus: os.cpus().length,
      totalMem: os.totalmem(),
      freeMem: os.freemem()
    },
    process: {
      uptime: process.uptime(),
      memory: memUsed.rss,
      node: process.version
    }
  });
});

/**
 * PDS LOAD
 * Serves the raw SQLite database file to the frontend.
 */
app.get('/api/pds/load', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: 'Sovereign ledger not found on disk.' });
  }
});

/**
 * PDS PERSIST
 * Receives the SQLite binary from the client and commits it to disk.
 */
app.post('/api/pds/persist', (req, res) => {
  try {
    if (!req.body || req.body.length === 0) {
      throw new Error("Received empty binary stream.");
    }
    fs.writeFileSync(DB_FILE, req.body);
    console.log(`[OmniPDS] Persisted ${req.body.length} bytes to ${DB_FILE}`);
    res.sendStatus(200);
  } catch (e) {
    console.error('[OmniPDS] Persistence Failure:', e);
    res.status(500).json({ error: e.message });
  }
});

/**
 * SPA FALLBACK
 * Routes all non-API requests to index.html for client-side routing.
 * Regex excludes any path starting with /api or specific files.
 */
app.get(/^(?!\/api|\/env\.js).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Sovereign Core
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  =========================================
  OmniPDS Sovereign Infrastructure Active
  =========================================
  Core Version: 1.2.0
  Port:         ${PORT}
  Environment:  ${process.env.NODE_ENV || 'Development'}
  AI Gateway:   ${process.env.API_KEY ? 'CONNECTED' : 'STANDALONE'}
  Storage:      ${DB_FILE}
  =========================================
  Local Access: http://localhost:${PORT}
  =========================================
  `);
});

// Graceful error handling for port conflicts
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is occupied by another process.`);
  } else {
    console.error('[FATAL] Unhandled System Exception:', e);
  }
  process.exit(1);
});
