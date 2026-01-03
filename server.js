
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
    core: 'omnipds-2.0.0-muscle-pro',
    ai: {
      active: !!process.env.API_KEY,
      engine: 'gemini-3-pro-preview'
    },
    system: {
      platform: os.platform(),
      uptime: process.uptime(),
      load: os.loadavg(),
      cpus: os.cpus().length,
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

// BULLETPROOF SPA FALLBACK: Avoids Express 5 Path-to-Regexp issues by using standard middleware
app.use((req, res, next) => {
  // If request is not for API and doesn't look like a file (no extension), serve index.html
  if (!req.path.startsWith('/api') && !req.path.includes('.')) {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║         OMNIPDS SOVEREIGN CORE v2.0.0        ║
  ║             --- MUSCLE EDITION ---           ║
  ╠══════════════════════════════════════════════╣
  ║ ADDR: http://localhost:${PORT}                 ║
  ║ DB:   omnipds.sqlite                         ║
  ║ AI:   ${process.env.API_KEY ? 'CONNECTED' : 'OFFLINE'}                     ║
  ╚══════════════════════════════════════════════╝
  `);
});
