const express = require('express');
const fs = require('fs');
const { google } = require('googleapis');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

let logs = [];

const SHEET_ID = process.env.SHEET_ID;
const CREDENTIALS = require('./credentials.json');

const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets({ version: 'v4', auth });

function appendToSheet(data) {
    sheets.spreadsheets.values.append({
        spreadsheetId: SHEET_ID,
        range: 'A:E',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [data]
        }
    }, (err, res) => {
        if (err) console.error('Google Sheets API Error:', err);
    });
}

function logAction(email, action, extra = "", campaign = "default") {
    const time = new Date().toISOString();
    const log = { email, action, time, extra, campaign };
    logs.push(log);
    appendToSheet([email, action, time, extra, campaign]);
    console.log(log);
}

app.get('/track/open', (req, res) => {
    const email = req.query.email || 'unknown';
    const campaign = req.query.campaign || 'default';
    logAction(email, 'OPEN', "", campaign);
    res.set('Content-Type', 'image/png');
    fs.createReadStream('1x1.png').pipe(res);
});

app.get('/track/click', (req, res) => {
    const email = req.query.email || 'unknown';
    const target = req.query.target || 'https://example.com';
    const campaign = req.query.campaign || 'default';
    logAction(email, 'CLICK', target, campaign);
    res.redirect(target);
});

app.get('/', (req, res) => res.redirect('/dashboard'));

app.get('/dashboard', (req, res) => {
    let html = `
    <html><head><title>Dashboard</title><style>
    body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { padding: 8px; border: 1px solid #ddd; font-size: 14px; }
    th { background: #eee; }
    .open { color: green; font-weight: bold; }
    .click { color: blue; font-weight: bold; }
    </style></head><body>
    <h2>Email Tracking Dashboard</h2>
    <table><tr><th>Email</th><th>Action</th><th>Time</th><th>Link</th><th>Campaign</th></tr>`;
    logs.slice().reverse().forEach(log => {
        html += `<tr>
        <td>${log.email}</td>
        <td class="${log.action.toLowerCase()}">${log.action}</td>
        <td>${new Date(log.time).toLocaleString()}</td>
        <td>${log.extra}</td>
        <td>${log.campaign}</td>
        </tr>`;
    });
    html += `</table></body></html>`;
    res.send(html);
});

app.get('/summary', (req, res) => {
    const summary = {};
    logs.forEach(log => {
        const campaign = log.campaign || 'default';
        if (!summary[campaign]) summary[campaign] = { OPEN: 0, CLICK: 0 };
        summary[campaign][log.action] = (summary[campaign][log.action] || 0) + 1;
    });

    let html = `
    <html><head><title>Summary</title><style>
    body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
    table { width: 600px; border-collapse: collapse; margin: auto; }
    th, td { padding: 8px; border: 1px solid #ddd; text-align: center; }
    th { background: #eee; }
    </style></head><body>
    <h2 style="text-align:center;">📊 Campaign Summary</h2>
    <table><tr><th>Chiến dịch</th><th>Số OPEN</th><th>Số CLICK</th></tr>`;
    for (let camp in summary) {
        html += `<tr>
        <td>${camp}</td>
        <td>${summary[camp].OPEN || 0}</td>
        <td>${summary[camp].CLICK || 0}</td>
        </tr>`;
    }
    html += `</table></body></html>`;
    res.send(html);
});

app.listen(PORT, () => console.log('Server running on port', PORT));
