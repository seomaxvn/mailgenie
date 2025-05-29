const express = require('express');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

let logs = [];

function logAction(email, action, extra = "", campaign = "default") {
    const log = {
        email,
        action,
        extra,
        campaign,
        time: new Date().toISOString()
    };
    logs.push(log);
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

app.get('/logs', (req, res) => {
    res.json(logs);
});

app.get('/', (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', (req, res) => {
    const campaigns = [...new Set(logs.map(l => l.campaign))];
    let html = `
    <html>
    <head>
        <title>Email Campaign Dashboard</title>
        <style>
            body { font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px; }
            h2 { text-align: center; }
            .container { max-width: 1100px; margin: auto; background: white; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { padding: 10px; border: 1px solid #ddd; text-align: left; font-size: 14px; }
            th { background-color: #f2f2f2; }
            tr:hover { background-color: #f9f9f9; }
            .open { color: green; font-weight: bold; }
            .click { color: blue; font-weight: bold; }
            .filters { margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap; }
            input, select, button { padding: 6px 10px; font-size: 14px; }
        </style>
        <script>
            function filterLogs() {
                const emailFilter = document.getElementById('emailFilter').value.toLowerCase();
                const actionFilter = document.getElementById('actionFilter').value;
                const campaignFilter = document.getElementById('campaignFilter').value;
                const rows = document.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const email = row.dataset.email.toLowerCase();
                    const action = row.dataset.action;
                    const campaign = row.dataset.campaign;
                    const matchEmail = email.includes(emailFilter);
                    const matchAction = actionFilter === 'ALL' || action === actionFilter;
                    const matchCampaign = campaignFilter === 'ALL' || campaign === campaignFilter;
                    row.style.display = matchEmail && matchAction && matchCampaign ? '' : 'none';
                });
            }
            function exportCSV() {
                let csv = "Email,Hành động,Thời gian,Link,Chiến dịch\n";
                const rows = document.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    if (row.style.display !== "none") {
                        const cells = row.querySelectorAll("td");
                        csv += Array.from(cells).map(td => td.textContent.trim()).join(",") + "\n";
                    }
                });
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', 'email-tracking.csv');
                a.click();
            }
        </script>
    </head>
    <body>
    <div class="container">
        <h2>📊 Email Campaign Dashboard</h2>
        <div class="filters">
            <input type="text" id="emailFilter" onkeyup="filterLogs()" placeholder="Tìm email...">
            <select id="actionFilter" onchange="filterLogs()">
                <option value="ALL">Tất cả hành động</option>
                <option value="OPEN">OPEN</option>
                <option value="CLICK">CLICK</option>
            </select>
            <select id="campaignFilter" onchange="filterLogs()">
                <option value="ALL">Tất cả chiến dịch</option>`;
    campaigns.forEach(c => {
        html += `<option value="${c}">${c}</option>`;
    });
    html += `</select>
            <button onclick="exportCSV()">📁 Xuất CSV</button>
        </div>
        <table>
            <thead>
                <tr><th>Email</th><th>Hành động</th><th>Thời gian</th><th>Link</th><th>Chiến dịch</th></tr>
            </thead>
            <tbody>`;
    logs.slice().reverse().forEach(log => {
        html += `<tr data-email="${log.email}" data-action="${log.action}" data-campaign="${log.campaign}">
            <td>${log.email}</td>
            <td class="${log.action.toLowerCase()}">${log.action}</td>
            <td>${new Date(log.time).toLocaleString()}</td>
            <td>${log.extra || ''}</td>
            <td>${log.campaign}</td>
        </tr>`;
    });
    html += `
            </tbody>
        </table>
    </div>
    </body>
    </html>`;
    res.send(html);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
