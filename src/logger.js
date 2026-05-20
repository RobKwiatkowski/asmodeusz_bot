// Prosty logger plikowy. Kazdy dzien dostaje osobny plik, co ulatwia
// przeniesienie katalogu logs do wolumenu Dockera.
const fs = require('fs');
const path = require('path');
const { config } = require('./config');

function ensureLogDir() {
  if (!fs.existsSync(config.paths.logsDir)) {
    fs.mkdirSync(config.paths.logsDir, { recursive: true });
  }
}

function logToFile(message) {
  ensureLogDir();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timestamp = now.toISOString().replace('T', ' ').replace(/\..+/, '');
  const logEntry = `[${timestamp}] ${message}\n`;
  const logFilePath = path.join(config.paths.logsDir, `logs_${dateStr}.txt`);
  fs.appendFileSync(logFilePath, logEntry);
}

module.exports = {
  logToFile,
  ensureLogDir
};
