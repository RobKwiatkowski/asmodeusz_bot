// Klient Google Sheets. Sekret service account i ID arkusza sa brane z ENV/config.
const fs = require('fs');
const { google } = require('googleapis');
const { config } = require('../src/config');

let sheetsClient;
let cachedCredentials;

function maskValue(value, visibleStart = 6, visibleEnd = 4) {
  if (!value) return '(brak)';
  if (value.length <= visibleStart + visibleEnd) return value;
  return `${value.slice(0, visibleStart)}...${value.slice(-visibleEnd)}`;
}

function getGoogleServiceAccountFile() {
  const keyFile = config.files.googleServiceAccount;

  if (!keyFile) {
    throw new Error('Brakuje GOOGLE_SERVICE_ACCOUNT_FILE w konfiguracji.');
  }

  let stats;
  try {
    stats = fs.statSync(keyFile);
  } catch (error) {
    throw new Error(
      `Nie znaleziono pliku klucza Google Sheets: ${keyFile}. ` +
      'Sprawdz GOOGLE_SERVICE_ACCOUNT_FILE oraz mount w docker-compose.'
    );
  }

  if (!stats.isFile()) {
    throw new Error(
      `GOOGLE_SERVICE_ACCOUNT_FILE wskazuje na katalog zamiast pliku: ${keyFile}. ` +
      'Najczestsza przyczyna: brak hostowego pliku google-service-account.json przy mouncie Dockera.'
    );
  }

  return keyFile;
}

function loadGoogleServiceAccountCredentials() {
  if (cachedCredentials) {
    return cachedCredentials;
  }

  const keyFile = getGoogleServiceAccountFile();

  let credentials;
  try {
    credentials = JSON.parse(fs.readFileSync(keyFile, 'utf8'));
  } catch (error) {
    throw new Error(`Nie udalo sie odczytac JSON z pliku klucza Google Sheets: ${keyFile}.`);
  }

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      `Plik ${keyFile} nie wyglada na poprawny service account Google ` +
      '(brakuje client_email lub private_key).'
    );
  }

  cachedCredentials = credentials;
  return cachedCredentials;
}

function getGoogleSheetsDebugInfo() {
  const credentials = loadGoogleServiceAccountCredentials();

  return {
    spreadsheetId: config.google.spreadsheetId || '(brak)',
    keyFile: config.files.googleServiceAccount || '(brak)',
    serviceAccountEmail: credentials.client_email || '(brak)',
  };
}

function logGoogleSheetsDebugInfo(contextLabel) {
  const info = getGoogleSheetsDebugInfo();
  console.log(
    `[google-sheets] ${contextLabel} | ` +
    `spreadsheet=${maskValue(info.spreadsheetId, 8, 6)} | ` +
    `serviceAccount=${info.serviceAccountEmail} | ` +
    `keyFile=${info.keyFile}`
  );
}

function formatGoogleSheetsError(error) {
  const parts = [];
  const status = error?.response?.status || error?.status;
  const reason = error?.response?.data?.error?.status;
  const message =
    error?.response?.data?.error?.message ||
    error?.message ||
    'Nieznany blad';

  if (status) {
    parts.push(`status=${status}`);
  }

  if (reason) {
    parts.push(`reason=${reason}`);
  }

  parts.push(`message=${message}`);
  return parts.join(' | ');
}

function getSheetsClient() {
  if (!config.google.spreadsheetId) {
    throw new Error('Brakuje GOOGLE_SPREADSHEET_ID w konfiguracji.');
  }

  if (!sheetsClient) {
    const credentials = loadGoogleServiceAccountCredentials();
    console.log(
      `[google-sheets] Inicjalizacja klienta | ` +
      `spreadsheet=${maskValue(config.google.spreadsheetId, 8, 6)} | ` +
      `serviceAccount=${credentials.client_email} | keyFile=${config.files.googleServiceAccount}`
    );

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    // Sheets API lepiej wspolpracuje tu z klasycznym tokenem OAuth niz z self-signed JWT.
    auth.useJWTAccessWithScope = false;

    sheetsClient = google.sheets({ version: 'v4', auth });
  }

  return sheetsClient;
}

async function getSheetValues(range, contextLabel = 'google-sheets') {
  logGoogleSheetsDebugInfo(`${contextLabel}: start odczytu zakresu ${range}`);

  try {
    const response = await getSheetsClient().spreadsheets.values.get({
      spreadsheetId: config.google.spreadsheetId,
      range,
    });
    const rowCount = response.data.values?.length || 0;
    console.log(`[google-sheets] ${contextLabel}: sukces, wiersze=${rowCount}, zakres=${range}`);
    return response.data.values || [];
  } catch (error) {
    console.error(`[google-sheets] ${contextLabel}: blad, ${formatGoogleSheetsError(error)}`);
    throw error;
  }
}

const sheets = new Proxy({}, {
  get(_target, prop) {
    return getSheetsClient()[prop];
  }
});

const SPREADSHEET_ID = config.google.spreadsheetId;

module.exports = {
  formatGoogleSheetsError,
  getGoogleSheetsDebugInfo,
  getSheetValues,
  logGoogleSheetsDebugInfo,
  sheets,
  SPREADSHEET_ID,
};
