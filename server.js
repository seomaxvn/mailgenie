const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

let logs = [];

function logAction(email, action, extra = "") {
    const log = {
        email,
        action,
        extra,
        time: new Date().toISOString()
    };
    logs.push(log);
    console.log(log);
}

app.get('/track/open', (req, res) => {
    const email = req.query.email || 'unknown';
    logAction(email, 'OPEN');
    res.set('Content-Type', 'image/png');
    fs.createReadStream('1x1.png').pipe(res);
});

app.get('/track/click', (req, res) => {
    const email = req.query.email || 'unknown';
    const target = req.query.target || 'https://example.com';
    logAction(email, 'CLICK', target);
    res.redirect(target);
});

app.get('/logs', (req, res) => {
    res.json(logs);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
