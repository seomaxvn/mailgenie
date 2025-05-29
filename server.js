
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const SHEET_ID = process.env.SHEET_ID;

const CREDENTIALS = {
  type: "service_account",
  project_id: "social-share-430305",
  private_key_id: "caf43fdf35160f9917ff7f4c7f1fc7dc33ed27e5",
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: "genlogin@social-share-430305.iam.gserviceaccount.com",
  client_id: "104567596075993457131",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/genlogin%40social-share-430305.iam.gserviceaccount.com"
};


const auth = new google.auth.JWT(
  CREDENTIALS.client_email,
  null,
  CREDENTIALS.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

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
    else console.log('✅ Logged:', data);
  });
}

app.get('/track/open', (req, res) => {
  const { email, campaign } = req.query;
  const time = new Date().toISOString();
  appendToSheet([email, 'OPEN', time, '', campaign]);
  res.sendFile(path.join(__dirname, '1x1.png'));
});

app.get('/track/click', (req, res) => {
  const { email, campaign, target } = req.query;
  const time = new Date().toISOString();
  appendToSheet([email, 'CLICK', time, target, campaign]);
  res.redirect(target);
});

app.get('/', (req, res) => {
  res.send('MailGenie Tracking Server');
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
