
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

app.use(express.static(__dirname, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '100mb' }));

app.get('/env.js', (req, res) => {
  res.set('Content-Type', 'application/javascript');
  const key = process.env.API_KEY || '';
  res.send(`window.process = { env: { API_KEY: "${key}" } };`);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    core: 'omnipds-3.0.0-heavy',
    system: {
      platform: os.platform(),
      uptime: process.uptime(),
      load: os.loadavg(),
      cpus: os.cpus().length,
      totalMem: os.totalmem(),
      freeMem: os.freemem()
    },
    ai: { active: !!process.env.API_KEY }
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
    fs.writeFileSync(DB_FILE, req.body);
    res.sendStatus(200);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.use((req, res, next) => {
  const isApi = req.path.startsWith('/api');
  const hasExt = path.extname(req.path) !== '';
  if (!isApi && !hasExt) return res.sendFile(path.join(__dirname, 'index.html'));
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  OMNIPDS HEAVY CORE ONLINE\n  PORT: ${PORT}\n  DB: ${DB_FILE}\n`);
});
