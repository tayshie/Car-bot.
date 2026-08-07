import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PermissionFlagsBits } from 'discord.js';

const LORE_FILE = fileURLToPath(new URL('../data/lore.json', import.meta.url));

let lore = load();

function load() {
  try {
    return JSON.parse(readFileSync(LORE_FILE, 'utf8'));
  } catch {
    return { users: {}, channels: {}, all: [] };
  }
}

function save() {
  try {
    mkdirSync(fileURLToPath(new URL('../data', import.meta.url)), { recursive: true });
    writeFileSync(LORE_FILE, JSON.stringify(lore));
  } catch {
    /* disk full, whatever */
  }
}

export function addMessage({ userId, username, channelId, channelName, content, ts }) {
  const entry = { userId, username, channelId, channelName, content, ts };
  const ch = (lore.channels[channelId] ||= []);
  ch.push(entry);
  if (ch.length > 40) ch.splice(0, ch.length - 40);

  const u = (lore.users[userId] ||= { name: username, msgs: [] });
  u.name = username;
  u.msgs.push(entry);
  if (u.msgs.length > 20) u.msgs.splice(0, u.msgs.length - 20);

  lore.all.push(entry);
  if (lore.all.length > 5000) lore.all.splice(0, lore.all.length - 5000);
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
  console.log(`Server memory backfill done: ${added} messages from ${channels.length} channels.`);
}
