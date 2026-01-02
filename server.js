
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// Load environment variables from .env.local if it exists
// Note: systemd's EnvironmentFile also loads these, but this allows local 'node server.js' to work too.
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
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
    // Sanitize output - only send the key, not the whole process.env
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
        console.log(`[OmniPDS] Serving ledger to client: ${req.ip}`);
        res.sendFile(DB_FILE);
    } else {
        res.status(404).send('No DB found');
    }
});

// Save DB to Disk
app.post('/api/pds/persist', (req, res) => {
    try {
        fs.writeFileSync(DB_FILE, req.body);
        const size = (req.body.length / 1024).toFixed(2);
        console.log(`[OmniPDS] Ledger committed: ${size}KB at ${new Date().toISOString()}`);
        res.sendStatus(200);
    } catch (e) {
        console.error('[OmniPDS] Persistence Error:', e);
        res.status(500).send(e.message);
    }
});

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server with error handling
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ========================================
    OmniPDS - Universal Data Protocol Active
    ========================================
    Status:   PRIMED
    Port:     ${PORT}
    Ledger:   ${DB_FILE}
    AI:       ${process.env.API_KEY ? 'ENABLED (Gemini 3 Pro)' : 'DISABLED (Check .env.local)'}
    Process:  ${process.pid}
    ========================================
    `);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`[FATAL] Port ${PORT} is already in use by another process.`);
        process.exit(1);
    } else {
        console.error('[FATAL] Server error:', e);
        process.exit(1);
    }
});
