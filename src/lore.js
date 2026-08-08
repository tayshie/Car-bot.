import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PermissionFlagsBits } from 'discord.js';
import * as logger from './logger.js';

const LORE_FILE = fileURLToPath(new URL('../data/lore.json', import.meta.url));

const CHANNEL_LIMIT = Number(process.env.LORE_CHANNEL_LIMIT || 40);
const USER_LIMIT = Number(process.env.LORE_USER_LIMIT || 20);
const TOTAL_LIMIT = Number(process.env.LORE_TOTAL_LIMIT || 5000);
const SAVE_INTERVAL_MS = Number(process.env.LORE_SAVE_INTERVAL_MS || 5000);
const MAX_USERS = Number(process.env.LORE_MAX_USERS || 1000);

let lore = load();
let dirty = false;
let saveTimer = null;

function load() {
  try {
    return JSON.parse(readFileSync(LORE_FILE, 'utf8'));
  } catch {
    return { users: {}, channels: {}, all: [] };
  }
}

function flush() {
  if (!dirty) return;
  dirty = false;
  try {
    mkdirSync(fileURLToPath(new URL('../data', import.meta.url)), { recursive: true });
    writeFileSync(LORE_FILE, JSON.stringify(lore));
  } catch {
    /* disk full, whatever */
  }
}

// Debounced save: collapses thousands of per-message writes into one write
// every SAVE_INTERVAL_MS. Also flushes on process exit.
function save() {
  dirty = true;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    flush();
  }, SAVE_INTERVAL_MS);
}

process.on('exit', flush);

export function addMessage({ userId, username, channelId, channelName, content, ts }) {
  const entry = { userId, username, channelId, channelName, content, ts };
  const ch = (lore.channels[channelId] ||= []);
  ch.push(entry);
  if (ch.length > CHANNEL_LIMIT) ch.splice(0, ch.length - CHANNEL_LIMIT);

  const u = (lore.users[userId] ||= { name: username, msgs: [] });
  u.name = username;
  u.msgs.push(entry);
  if (u.msgs.length > USER_LIMIT) u.msgs.splice(0, u.msgs.length - USER_LIMIT);

  lore.all.push(entry);
  if (lore.all.length > TOTAL_LIMIT) lore.all.splice(0, lore.all.length - TOTAL_LIMIT);

  // Prune least-active users if the user map balloons past MAX_USERS.
  if (Object.keys(lore.users).length > MAX_USERS) {
    const sorted = Object.entries(lore.users).sort((a, b) => a[1].msgs.length - b[1].msgs.length);
    const overflow = sorted.length - MAX_USERS;
    for (let i = 0; i < overflow; i++) delete lore.users[sorted[i][0]];
  }

  save();
}

export function recentChannel(channelId, n) {
  return (lore.channels[channelId] || []).slice(-n);
}

export function recentByUser(userId, n) {
  return (lore.users[userId]?.msgs || []).slice(-n);
}

export function recentGossip(n) {
  return lore.all.slice(-n).reverse();
}

export async function backfill(client, guild, { perChannel = 50, maxChannels = 40 } = {}) {
  const channels = guild.channels.cache
    .filter(
      (c) =>
        c.type === 0 &&
        c.permissionsFor(guild.members.me)?.has(PermissionFlagsBits.ReadMessageHistory | PermissionFlagsBits.ViewChannel)
    )
    .first(maxChannels);
  let added = 0;
  for (const ch of channels) {
    try {
      const messages = await ch.messages.fetch({ limit: perChannel });
      for (const m of messages.values()) {
        if (m.author.bot || !m.content) continue;
        addMessage({
          userId: m.author.id,
          username: m.author.username,
          channelId: ch.id,
          channelName: ch.name,
          content: m.content,
          ts: m.createdTimestamp,
        });
        added++;
      }
    } catch {
      /* skip channels we can't read */
    }
  }
  flush();
  logger.log(`Server memory backfill done: ${added} messages from ${channels.length} channels.`);
}
