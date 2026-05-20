// Klient Google Sheets. Sekret service account i ID arkusza sa brane z ENV/config.
const { google } = require('googleapis');
const { config } = require('../src/config');

const auth = new google.auth.GoogleAuth({
  keyFile: config.files.googleServiceAccount,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = config.google.spreadsheetId;

module.exports = { sheets, SPREADSHEET_ID };
