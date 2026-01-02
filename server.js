
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

// Load environment variables from .env.local if it exists
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

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

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'online', 
        storage: DB_FILE,
        ai_active: !!process.env.API_KEY 
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
        console.log(`[OmniPDS] Ledger committed to disk: ${new Date().toISOString()}`);
        res.sendStatus(200);
    } catch (e) {
        console.error(e);
        res.status(500).send(e.message);
    }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ========================================
    OmniPDS - Universal Data Protocol Active
    ========================================
    Port: ${PORT}
    Ledger: ${DB_FILE}
    AI Status: ${process.env.API_KEY ? 'PRIMED' : 'OFFLINE (Check .env.local)'}
    ========================================
    `);
});
