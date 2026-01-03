
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

// Static middleware - Serve all files from root
app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    // Force JS mime type for TypeScript files so Babel can parse them
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
    core: 'omnipds-1.8.0-muscle',
    ai: {
      active: !!process.env.API_KEY,
      engine: 'gemini-3-pro-preview'
    },
    system: {
      platform: os.platform(),
      uptime: process.uptime(),
      load: os.loadavg(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      }
    }
  });
});

app.get('/api/pds/load', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).json({ error: 'Ledger not found' });
  }
});

app.post('/api/pds/persist', (req, res) => {
  try {
    if (!req.body || req.body.length === 0) throw new Error("Persistence stream empty");
    fs.writeFileSync(DB_FILE, req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("[OmniPDS] Persist Error:", e.message);
    res.status(500).send(e.message);
  }
});

// Express 5 / path-to-regexp v8 Fixed Fallback
// Using '*' as the most robust catch-all in Express 5
app.get('*', (req, res, next) => {
  // If it's a request for an API route or a file with an extension that wasn't found, pass it on
  if (req.path.startsWith('/api') || req.path.includes('.')) {
    return next();
  }
  // Otherwise, serve index.html for SPA routing
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         OMNIPDS SOVEREIGN CORE v1.8.0        ║
  ╠══════════════════════════════════════════════╣
  ║ ADDR: http://localhost:${PORT}                 ║
  ║ DB:   omnipds.sqlite                         ║
  ║ AI:   ${process.env.API_KEY ? 'CONNECTED' : 'OFFLINE'}                     ║
  ╚══════════════════════════════════════════════╝
  `);
});
