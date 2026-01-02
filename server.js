
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
const PORT = 8087;
const DB_FILE = path.join(__dirname, 'omnipds.sqlite');

// Force application/javascript for .ts and .tsx files to satisfy strict MIME checking
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));

app.get('/env.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: "${key}" } };`);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    core: 'OmniPDS 1.3.0',
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
      memory: process.memoryUsage().rss
    }
  });
});

app.get('/api/pds/load', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: 'Sovereign ledger not yet initialized.' });
  }
});

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

// Improved SPA Catch-All
app.get('*', (req, res) => {
  if (req.path.includes('.') || req.path.startsWith('/api')) {
    return res.status(404).send('Not found');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         OMNIPDS SOVEREIGN CORE v1.3          ║
  ╠══════════════════════════════════════════════╣
  ║ PORT: ${PORT}                                   ║
  ║ STATUS: ONLINE                               ║
  ║ STORAGE: ${DB_FILE}                          ║
  ║ AI GATEWAY: ${process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}                     ║
  ╚══════════════════════════════════════════════╝
  Local Node: http://localhost:${PORT}
  `);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} is occupied.`);
  } else {
    console.error('[FATAL] System Error:', err);
  }
  process.exit(1);
});
