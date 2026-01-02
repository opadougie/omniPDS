
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

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

// Health Check / Diagnostic API
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        storage: DB_FILE,
        db_exists: fs.existsSync(DB_FILE),
        ai_active: !!process.env.API_KEY,
        node_version: process.version,
        uptime: process.uptime()
    });
});

// Load DB from Disk
app.get('/api/pds/load', (req, res) => {
    if (fs.existsSync(DB_FILE)) {
        res.sendFile(DB_FILE);
    } else {
        res.status(404).send('No DB found');
    }
});

// Save DB to Disk
app.post('/api/pds/persist', (req, res) => {
    try {
        fs.writeFileSync(DB_FILE, req.body);
        res.sendStatus(200);
    } catch (e) {
        console.error('[OmniPDS] Persistence Error:', e);
        res.status(500).send(e.message);
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniPDS] Relay Active on Port ${PORT}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${PORT} occupied.`);
        process.exit(1);
    }
});
