import { appendFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const LOG_FILE = fileURLToPath(new URL('../logs/carl.log', import.meta.url));
const MAX_LINES = 2000;

function ensureDir() {
  try {
    mkdirSync(fileURLToPath(new URL('../logs', import.meta.url)), { recursive: true });
  } catch {
    /* whatever */
  }
}

function ts() {
  return new Date().toISOString();
}

export function log(...args) {
  const line = `[${ts()}] ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
  console.log(line);
  try {
    ensureDir();
    appendFileSync(LOG_FILE, line + '\n');
    trim();
  } catch {
    /* no disk space, don't crash */
  }
}

export function error(...args) {
  const line = `[${ts()}] [ERROR] ${args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')}`;
  console.error(line);
  try {
    ensureDir();
    appendFileSync(LOG_FILE, line + '\n');
    trim();
  } catch {
    /* no disk space, don't crash */
  }
}

function trim() {
  try {
    if (!existsSync(LOG_FILE)) return;
    const lines = readFileSync(LOG_FILE, 'utf8').split('\n');
    if (lines.length > MAX_LINES) {
      writeFileSync(LOG_FILE, lines.slice(-MAX_LINES).join('\n'));
    }
  } catch {
    /* whatever */
  }
}
