import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const DATA_FILE = fileURLToPath(new URL('../data/records.json', import.meta.url));

let records = load();

function load() {
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { deadlines: [], birthdays: [], quotes: [], counter: 0 };
  }
}

function save() {
  try {
    mkdirSync(fileURLToPath(new URL('../data', import.meta.url)), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(records));
  } catch {
    /* whatever */
  }
}

function nextId() {
  records.counter = (records.counter || 0) + 1;
  return records.counter;
}

export function addDeadline({ userId, username, task, dueAt, channelId }) {
  const entry = {
    id: nextId(),
    userId,
    username,
    task,
    dueAt,
    channelId,
    done: false,
    naggedOnce: false,
    lastNagAt: 0,
  };
  records.deadlines.push(entry);
  save();
  return entry;
}

export function listDeadlines() {
  return records.deadlines.filter((d) => !d.done);
}

export function markDeadlineDone(id) {
  const d = records.deadlines.find((x) => x.id === Number(id));
  if (d && !d.done) {
    d.done = true;
    d.doneAt = Date.now();
    save();
  }
  return d;
}

export function nagDueDeadlines() {
  const now = Date.now();
  const nags = [];
  for (const d of records.deadlines) {
    if (d.done) continue;
    if (now >= d.dueAt) {
      if (now - (d.lastNagAt || 0) < 3600000) continue;
      d.lastNagAt = now;
      nags.push({ ...d, type: 'overdue' });
    } else if (d.dueAt - now <= 3600000 && !d.naggedOnce) {
      d.naggedOnce = true;
      d.lastNagAt = now;
      nags.push({ ...d, type: 'soon' });
    }
  }
  if (nags.length) save();
  return nags;
}

export function addBirthday({ userId, username, date }) {
  const existing = records.birthdays.find((b) => b.userId === userId);
  if (existing) {
    existing.date = date;
    existing.username = username;
    save();
    return existing;
  }
  const entry = { userId, username, date, addedAt: Date.now() };
  records.birthdays.push(entry);
  save();
  return entry;
}

export function listBirthdays() {
  return records.birthdays;
}

export function todayBirthdays() {
  const now = new Date();
  const today = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return records.birthdays.filter((b) => b.date === today);
}

export function addQuote({ userId, username, content, channelName, tag }) {
  const entry = {
    id: nextId(),
    userId,
    username,
    content,
    channelName,
    tag: tag || null,
    ts: Date.now(),
  };
  records.quotes.push(entry);
  if (records.quotes.length > 200) records.quotes.splice(0, records.quotes.length - 200);
  save();
  return entry;
}

export function listQuotes(tag) {
  const q = records.quotes;
  return tag ? q.filter((x) => x.tag && x.tag.toLowerCase() === tag.toLowerCase()) : q;
}

export function randomQuote() {
  const q = records.quotes;
  if (!q.length) return null;
  return q[Math.floor(Math.random() * q.length)];
}
