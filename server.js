
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

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = path.join(__dirname, 'omnipds.sqlite');

// Middleware
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '50mb' }));
app.use(express.static(__dirname));

// Endpoint to provide environment variables to the frontend safely
app.get('/env.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  res.send(`window.process = { env: { API_KEY: "${process.env.API_KEY || ''}" } };`);
});

// Advanced Health & Infrastructure API
app.get('/api/health', (req, res) => {
  const memUsed = process.memoryUsage();
  res.json({
    status: 'online',
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

// PDS Data Persistence Endpoints
app.get('/api/pds/load', (req, res) => {
  if (fs.existsSync(DB_FILE)) {
    res.sendFile(DB_FILE);
  } else {
    res.status(404).send('No DB found');
  }
});

app.post('/api/pds/persist', (req, res) => {
  try {
    fs.writeFileSync(DB_FILE, req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('[OmniPDS] Persistence Failure:', e);
    res.status(500).send(e.message);
  }
});

// SPA Fallback - Updated for Express 5 / path-to-regexp v6+ compatibility
app.get('(.*)', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Critical Startup Error Handling
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  OmniPDS Sovereign Core
  ----------------------
  Status:  RUNNING
  Port:    ${PORT}
  Root:    ${__dirname}
  AI:      ${process.env.API_KEY ? 'ACTIVE' : 'OFFLINE'}
  ----------------------
  `);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`[FATAL] Port ${PORT} occupied. OmniPDS cannot start.`);
  } else {
    console.error('[FATAL] Unhandled Server Error:', e);
  }
  process.exit(1);
});
