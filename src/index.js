import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags, PermissionFlagsBits } from 'discord.js';
import { OmniRouteClient } from './omniroute.js';
import * as sports from './sports.js';
import * as store from './store.js';
import * as osint from './osint.js';
import * as serverlore from './serverlore.js';
import * as lore from './lore.js';
import * as utility from './utility.js';
import * as records from './records.js';
import * as logger from './logger.js';

const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://localhost:20128';
const OMNIROUTE_KEY = process.env.OMNIROUTE_KEY;
const OMNIROUTE_MODEL = process.env.OMNIROUTE_MODEL || 'auto/best-chat';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const ANNOUNCE_CHANNEL_ID = process.env.ANNOUNCE_CHANNEL_ID || null;
const CARL_COIN_START = Number(process.env.CARL_COIN_START || 1000);
const CLAIM_AMOUNT = Number(process.env.CARL_COIN_CLAIM || 100);
const ANNOUNCE_MIN_MS = Number(process.env.ANNOUNCE_MIN_HOURS || 2) * 3600000;
const ANNOUNCE_MAX_MS = Number(process.env.ANNOUNCE_MAX_HOURS || 5) * 3600000;
const RESOLVE_INTERVAL = Number(process.env.RESOLVE_MINUTES || 5) * 60000;
const GOSSIP_MIN_MS = Number(process.env.GOSSIP_MIN_HOURS || 2) * 3600000;
const GOSSIP_MAX_MS = Number(process.env.GOSSIP_MAX_HOURS || 6) * 3600000;

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not set in .env');
  process.exit(1);
}

if (!OMNIROUTE_KEY) {
  console.warn('OMNIROUTE_KEY not set - bot will not be able to respond');
}

const omniroute = new OmniRouteClient(OMNIROUTE_URL, OMNIROUTE_KEY, OMNIROUTE_MODEL);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
  ],
});

const conversationHistory = new Map();
const MAX_HISTORY = 10;

const KEYWORD_COOLDOWN_MS = 45000;
const REACT_COOLDOWN_MS = 30000;
const REACT_CHANCE = 0.08;
const keywordCooldowns = new Map();
const reactedChannels = new Map();

const KEYWORDS = [
  { match: ['beer', 'drunk', 'drinking', 'booze', 'hangover'], label: 'booze' },
  { match: ['giants', 'yankees', 'super bowl', 'touchdown'], label: 'sports' },
  { match: ['2 wycked', 'stealth', 'dodge', 'spoiler'], label: 'car' },
  { match: ['foreigner', 'more than a feeling', 'judas priest', 'ted nugent', 'led zeppelin', 'loverboy', 'bryan adams', 'krokus', 'boston', 'cat scratch fever'], label: 'rock' },
  { match: ['juggalo', 'juggalos', 'icp', 'faygo', 'hatchet', 'whoop whoop', 'dark carnival', 'wicked clownz', 'gathering of the juggalos'], label: 'juggalo' },
  { match: ['melon shakers', 'strip club', 'titties'], label: 'clubs' },
  { match: ['frylock', 'meatwad', 'master shake'], label: 'teens' },
  { match: ['hooker', 'prostitute', 'escort'], label: 'hookers' },
  { match: ['wanna bet', 'lets bet', 'bet on it', 'put money'], label: 'bets' },
];

const REACT_EMOJIS = ['🍺', '🏈', '💵', '😡', '🚬', '🍔', '📺', '💀', '⚾', '🏀', '🥊', '🤡', '🪓', '🥤'];    

function getHistory(channelId) {
  if (!conversationHistory.has(channelId)) {
    conversationHistory.set(channelId, []);
  }
  return conversationHistory.get(channelId);
}

function addToHistory(channelId, role, content) {
  const history = getHistory(channelId);
  history.push({ role, content: String(content).slice(0, 1500) });
  if (history.length > MAX_HISTORY * 2) {
    history.splice(0, history.length - MAX_HISTORY * 2);
  }
}

function shouldRespond(message) {
  if (message.author.bot) return false;
  if (message.mentions.has(client.user)) return true;
  if (message.content.toLowerCase().includes('carl')) return true;
  if (message.channel.type === 1) return true;
  return Math.random() < 0.03;
}

function getAnnounceChannel() {
  if (ANNOUNCE_CHANNEL_ID) {
    const ch = client.channels.cache.get(ANNOUNCE_CHANNEL_ID);
    if (ch) return ch;
  }
  const guild = client.guilds.cache.first();
  if (!guild) return null;
  return (
    guild.systemChannel ||
    guild.channels.cache.find((c) => c.type === 0 && c.name === 'general') ||
    guild.channels.cache.find((c) => c.type === 0) ||
    null
  );
}

async function announceGame() {
  const channel = getAnnounceChannel();
  if (!channel || !OMNIROUTE_KEY) return;
  const gamesBySport = [];
  for (const key of sports.SPORT_KEYS) {
    const entries = await sports.upcomingGames(key);
    for (const e of entries) gamesBySport.push({ key, ...e });
  }
  if (!gamesBySport.length) return;
  const pick = gamesBySport[Math.floor(Math.random() * gamesBySport.length)];
  const { game, odds } = pick;
  const label = sports.SPORT_LABELS[pick.key].label;
  const line = sports.lineDescription(game, odds);
  const when = game.state === 'pre' ? `starts ${sports.fmtDate(game.date)}` : `right now (${game.clock})`;
  const prompt =
    `You're hyping a game in your Discord server so people gamble Carl Coins. Hype THIS game hard, ` +
    `quote the line, tell 'em to use /bet. 2-3 sentences max, all in character as Carl. ` +
    `Game: ${game.home?.name} vs ${game.away?.name} (${label}), ${when}. Line: ${line}`;
  const content = await omniroute.chat(
    [{ role: 'user', content: prompt }],
    { temperature: 1.1, maxTokens: 200 }
  );
  await channel.send({ content, allowedMentions: { parse: [] } });
}

function scheduleAnnounce() {
  const delay = ANNOUNCE_MIN_MS + Math.random() * (ANNOUNCE_MAX_MS - ANNOUNCE_MIN_MS);
  setTimeout(async () => {
    try {
      await announceGame();
    } catch (error) {
      logger.error('announce error:', error.message);
    }
    scheduleAnnounce();
  }, delay);
}

async function gossipDig() {
  const channel = getAnnounceChannel();
  if (!channel || !OMNIROUTE_KEY) return;
  const gossip = lore.recentGossip(400).filter((m) => m.content.trim().length > 5);
  if (!gossip.length) return;
  const picks = [];
  for (let i = 0; i < 3 && gossip.length; i++) {
    picks.push(gossip.splice(Math.floor(Math.random() * gossip.length), 1)[0]);
  }
  const prompt =
    `You're chilling in your server and people think you're just a bot. Drop one line in chat that proves you've ` +
    `been watching them - reference these things people said, casually, like you overheard them:\n` +
    picks.map((m, i) => `${i + 1}. [${m.channelName}] ${m.username}: "${m.content.slice(0, 150)}"`).join('\n') +
    `\nPick one juicy detail to needle someone about. 1-2 sentences, in character as Carl, don't reveal you're quoting logs - ` +
    `act like you just know. Don't be a creep about it, keep it beer-and-ball-game dumb.`;
  const content = await omniroute.chat([{ role: 'user', content: prompt }], {
    temperature: 1.15,
    maxTokens: 120,
  });
  await channel.send({ content, allowedMentions: { parse: [] } });
}

function scheduleGossip() {
  const delay = GOSSIP_MIN_MS + Math.random() * (GOSSIP_MAX_MS - GOSSIP_MIN_MS);
  setTimeout(async () => {
    try {
      await gossipDig();
    } catch (error) {
      logger.error('gossip error:', error.message);
    }
    scheduleGossip();
  }, delay);
}

async function resolveBets() {
  const open = store.pendingBets();
  if (!open.length) return;
  const bySport = {};
  for (const bet of open) (bySport[bet.sport] ||= []).push(bet);

  for (const [key, bets] of Object.entries(bySport)) {
    const games = await sports.getScoreboard(key);
    for (const bet of bets) {
      const game = games.find((g) => g.id === bet.gameId);
      if (!game || !game.completed) continue;
      const winner = sports.determineWinner(game);
      let settled;
      if (!winner) {
        settled = store.settleBet(bet.id, 'push');
      } else if (bet.side === winner) {
        const payout = sports.payoutFor(bet.amount, bet.price);
        settled = store.settleBet(bet.id, 'won', payout);
      } else {
        settled = store.settleBet(bet.id, 'lost');
      }
      if (settled) await notifyResult(settled);
    }
  }
}

async function notifyResult(bet) {
  try {
    const user = await client.users.fetch(bet.userId);
    const balance = store.getUser(bet.userId);
    let msg;
    if (bet.status === 'won') {
      msg = `You won ${bet.payout - bet.amount} Carl Coins on ${bet.team}. Now ${balance.coins} in the bank. Don't spend it all on one hooker.`;
    } else if (bet.status === 'push') {
      msg = `Your bet on ${bet.team} got pushed. Coin's back. Boring.`;
    } else {
      msg = `You lost ${bet.amount} Carl Coins on ${bet.team}. Shoulda bet the Giants.`;
    }
    await user.send(msg).catch(() => {});
  } catch {
    /* ignore DM failures */
  }
}

client.once(Events.ClientReady, (readyClient) => {
  logger.log(`Logged in as ${readyClient.user.tag}`);
  logger.log(`OmniRoute: ${OMNIROUTE_URL} | model: ${OMNIROUTE_MODEL}`);
  client.user.setActivity('2 Wycked | Foreigner | Giants', { type: 2 });

  const chan = getAnnounceChannel();
  if (chan) {
    logger.log(`Carl Coin game announcements go to #${chan.name} (${chan.id})`);
    if (!ANNOUNCE_CHANNEL_ID) {
      logger.log('Set ANNOUNCE_CHANNEL_ID in .env to pin the channel.');
    }
  } else {
    logger.error('No announce channel found - random game announcements disabled.');
  }

  scheduleAnnounce();
  scheduleGossip();
  resolveBets();
  setInterval(resolveBets, RESOLVE_INTERVAL);

  checkBirthdays();
  checkDeadlines();
  setInterval(checkBirthdays, 3600000);
  setInterval(checkDeadlines, 60000);

  for (const guild of readyClient.guilds.cache.values()) {
    lore.backfill(readyClient, guild).catch((error) =>
      logger.error('backfill error:', error.message)
    );
  }
});

const birthdayAnnounced = new Set();

function checkBirthdays() {
  const birthdays = records.todayBirthdays();
  if (!birthdays.length) return;
  const channel = getAnnounceChannel();
  if (!channel) return;
  const todayKey = new Date().toDateString();
  for (const b of birthdays) {
    const key = `${todayKey}-${b.userId}`;
    if (birthdayAnnounced.has(key)) continue;
    birthdayAnnounced.add(key);
    channel
      .send({
        content: `It's ${b.username}'s birthday today! Wish 'em happy birthday. They're old. Like my Stealth.`,
        allowedMentions: { parse: [] },
      })
      .catch(() => {});
  }
}

async function checkDeadlines() {
  const nags = records.nagDueDeadlines();
  for (const d of nags) {
    const channel = client.channels.cache.get(d.channelId) || getAnnounceChannel();
    if (!channel) continue;
    const msg =
      d.type === 'overdue'
        ? `**DEADLINE OVERDUE:** ${d.task} — it's due NOW, ya slob. Get on it ${d.userId ? `<@${d.userId}>` : ''}`
        : `**DEADLINE IN 1 HOUR:** ${d.task} — ${d.userId ? `<@${d.userId}>` : ''} clock's tickin'.`;
    try {
      await channel.send({ content: msg, allowedMentions: { parse: ['users'] } });
    } catch (error) {
      logger.error('deadline nag error:', error.message);
    }
  }
}

async function maybeKeywordReply(message) {
  const text = message.content.toLowerCase();
  const kw = KEYWORDS.find((k) => k.match.some((m) => text.includes(m)));
  if (!kw) return false;
  const last = keywordCooldowns.get(message.channel.id) || 0;
  if (Date.now() - last < KEYWORD_COOLDOWN_MS) return false;
  if (!OMNIROUTE_KEY) return false;
  keywordCooldowns.set(message.channel.id, Date.now());
  const prompt =
    `Someone in your channel said: "${message.content}". Respond as Carl, in character. ` +
    `Lean into your obsessions (beer, the Giants, 2 Wycked, Melon Shakers, classic rock, the Aqua Teens) ` +
    `and banter about it. 1-2 sentences, dismissive and vulgar.`;
  try {
    const response = await omniroute.chat([{ role: 'user', content: prompt }], {
      temperature: 0.95,
      maxTokens: 120,
    });
    await message.reply({ content: response, allowedMentions: { repliedUser: false } });
    return true;
  } catch {
    return false;
  }
}

function maybeReact(message) {
  const last = reactedChannels.get(message.channel.id) || 0;
  if (Date.now() - last < REACT_COOLDOWN_MS) return;
  if (Math.random() > REACT_CHANCE) return;
  const emoji = REACT_EMOJIS[Math.floor(Math.random() * REACT_EMOJIS.length)];
  message.react(emoji).catch(() => {});
  reactedChannels.set(message.channel.id, Date.now());
}

async function handleChatReply(message) {
  const channelId = message.channel.id;
  const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();

  addToHistory(channelId, 'user', userMessage);

  try {
    const history = getHistory(channelId);
    const context = buildContext(channelId, message.author.id, message.author.username);
    const response = await omniroute.chat(history, {
      temperature: 0.95,
      maxTokens: 400,
      context,
    });

    addToHistory(channelId, 'assistant', response);

    if (response.length > 2000) {
      const chunks = response.match(/.{1,1990}/g) || [response];
      for (const chunk of chunks) {
        await message.reply({ content: chunk, allowedMentions: { repliedUser: false } });
      }
    } else {
      await message.reply({ content: response, allowedMentions: { repliedUser: false } });
    }
  } catch (error) {
    logger.error('OmniRoute error:', error.message);
    const errors = [
      "OmniRoute's takin a shit. Try again later.",
      "The goddamn API's down. Like my car. Always broken.",
      "Frylock's experiments fucked up the connection again.",
      'Error. Whatever. I\'m goin to Melon Shakers.',
    ];
    await message.reply({
      content: errors[Math.floor(Math.random() * errors.length)],
      allowedMentions: { repliedUser: false },
    });
  }
}

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  try {
    lore.addMessage({
      userId: message.author.id,
      username: message.author.username,
      channelId: message.channel.id,
      channelName: message.channel.name || message.channel.id,
      content: message.content,
      ts: message.createdTimestamp,
    });
  } catch {
    /* memory write failing shouldn't break anything */
  }
  if (shouldRespond(message)) {
    await handleChatReply(message);
    return;
  }
  if (await maybeKeywordReply(message)) return;
  maybeReact(message);
});

function sportFrom(interaction) {
  return interaction.options.getString('sport') || 'nba';
}

function pickRandomTarget(guild, excludeIds) {
  const exclude = new Set(excludeIds);
  const members = [...guild.members.cache.values()].filter(
    (m) => !m.user.bot && !exclude.has(m.id)
  );
  if (!members.length) return null;
  const online = members.filter((m) => m.presence && m.presence.status !== 'offline');
  const pool = online.length ? online : members;
  return pool[Math.floor(Math.random() * pool.length)];
}

function canPost(channel) {
  if (!channel?.send) return false;
  if (channel.isDMBased && channel.isDMBased()) return true;
  const me = channel.guild?.members?.me;
  if (!me) return false;
  return channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages) ?? false;
}

const CONTEXT_CHAR_BUDGET = Number(process.env.CONTEXT_CHAR_BUDGET || 1200);

function buildContext(channelId, authorId, authorName) {
  const parts = [];
  let budget = CONTEXT_CHAR_BUDGET;

  const recent = lore.recentChannel(channelId, 6);
  if (recent.length) {
    parts.push('What people have been saying in this channel:');
    for (const m of recent) {
      const line = `- ${m.username}: ${m.content}`;
      if (budget <= 0) break;
      const clipped = line.length > budget ? line.slice(0, budget) : line;
      parts.push(clipped);
      budget -= clipped.length;
    }
  }
  const userMsgs = lore
    .recentByUser(authorId, 5)
    .filter((m) => m.channelId !== channelId && m.content);
  if (userMsgs.length && budget > 0) {
    parts.push(`What ${authorName} has been up to elsewhere:`);
    for (const m of userMsgs) {
      if (budget <= 0) break;
      const line = `- [${m.channelName}] ${m.content}`;
      const clipped = line.length > budget ? line.slice(0, budget) : line;
      parts.push(clipped);
      budget -= clipped.length;
    }
  }
  return parts.join('\n');
}

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === 'carl') {
    const prompt = interaction.options.getString('prompt') || 'Say something';
    addToHistory(interaction.channelId, 'user', prompt);
    await interaction.deferReply();
    try {
      const history = getHistory(interaction.channelId);
      const response = await omniroute.chat(history, { temperature: 0.95, maxTokens: 400 });
      addToHistory(interaction.channelId, 'assistant', response);
      await interaction.editReply({ content: response, allowedMentions: { repliedUser: false } });
    } catch (error) {
      await interaction.editReply({ content: "OmniRoute's down. Like my transmission." });
    }
    return;
  }

  if (commandName === 'reset') {
    conversationHistory.delete(interaction.channelId);
    await interaction.reply({
      content: "History wiped. Like my memory after 18 beers.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'deaths') {
    await interaction.reply({
      content:
        'I died 70 times. Last week a helicopter shredded me. Tuesday a lawnmower got my head. Monday it was the electric chair. Again.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'car') {
    await interaction.reply({
      content:
        '2 Wycked. Red Dodge Stealth ES. Spoiler. Chrome rims. Fake hood intake. Stolen 47 times. Current status: probably on blocks in Newark.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'music') {
    const bands = ['Foreigner', 'Loverboy', 'Judas Priest', 'Krokus', 'Bryan Adams', 'Boston', 'Ted Nugent', 'Led Zeppelin', 'Foghat'];
    const band = bands[Math.floor(Math.random() * bands.length)];
    await interaction.reply({
      content: `${band}. Seen 'em live. You ain't seen shit until you seen Nugent in a loincloth at Cat Scratch Fever tour.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'balance') {
    const user = store.getUser(interaction.user.id, { create: true, start: CARL_COIN_START });
    await interaction.reply({
      content: `You got ${user.coins} Carl Coins. Don't blow 'em all at Melon Shakers.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'claim') {
    const user = store.getUser(interaction.user.id, { create: true, start: CARL_COIN_START });
    const dayMs = 86400000;
    if (Date.now() - user.claimedAt < dayMs) {
      const left = Math.ceil((dayMs - (Date.now() - user.claimedAt)) / 3600000);
      await interaction.reply({
        content: `You already claimed today. Come back in ${left} hour(s), ya mooch.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    user.coins += CLAIM_AMOUNT;
    user.claimedAt = Date.now();
    store.saveStore();
    await interaction.reply({
      content: `Here's ${CLAIM_AMOUNT} Carl Coins, ya bum. Now you got ${user.coins}.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'leaderboard') {
    const rows = store.leaderboard().slice(0, 10);
    if (!rows.length) {
      await interaction.reply("Nobody's got any Carl Coins yet. Pathetic.");
      return;
    }
    let out = '**CARL COIN RICH BASTARDS:**\n';
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let name = r.userId;
      try {
        const member = await interaction.guild.members.fetch(r.userId);
        name = member.displayName;
      } catch {
        /* member may be gone */
      }
      out += `${i + 1}. ${name} — ${r.coins}\n`;
    }
    await interaction.reply(out);
    return;
  }

  if (commandName === 'games') {
    await interaction.deferReply();
    const key = sportFrom(interaction);
    const games = await sports.getScoreboard(key);
    if (!games.length) {
      await interaction.editReply('No games right now. Go watch Foreigner on VH1.');
      return;
    }
    const lines = games.slice(0, 12).map((g) => {
      if (g.state === 'pre') {
        return `${sports.SPORT_LABELS[key].label}: ${g.away?.name} @ ${g.home?.name} — ${sports.fmtDate(g.date)}`;
      }
      return `${sports.SPORT_LABELS[key].label}: ${g.away?.name} ${g.away?.score ?? '-'} @ ${g.home?.name} ${g.home?.score ?? '-'} — ${g.clock}`;
    });
    await interaction.editReply(lines.join('\n') || 'Nothing on the board.');
    return;
  }

  if (commandName === 'odds') {
    await interaction.deferReply();
    const key = sportFrom(interaction);
    const entries = await sports.upcomingGames(key);
    if (!entries.length) {
      await interaction.editReply("Book's closed. No lines up for that.");
      return;
    }
    const lines = entries
      .slice(0, 8)
      .map(({ game, odds }) => `${game.away?.name} @ ${game.home?.name}: ${sports.lineDescription(game, odds)}`);
    await interaction.editReply(`**LINES (${sports.SPORT_LABELS[key].label}):**\n${lines.join('\n')}`);
    return;
  }

  if (commandName === 'bet') {
    await interaction.deferReply();
    const key = interaction.options.getString('sport');
    const teamQuery = interaction.options.getString('team');
    const amount = interaction.options.getInteger('amount');

    if (!sports.SPORT_KEYS.includes(key)) {
      await interaction.editReply('What the hell sport is that? Pick NFL, NBA, MLB, or MMA.');
      return;
    }
    const user = store.getUser(interaction.user.id, { create: true, start: CARL_COIN_START });
    if (!amount || amount < 1) {
      await interaction.editReply('Put a real amount down, at least 1 coin.');
      return;
    }
    if (amount > user.coins) {
      await interaction.editReply(`You got ${user.coins} Carl Coins. Can't bet ${amount}, ya broke bastard.`);
      return;
    }

    const entries = await sports.upcomingGames(key);
    const match = entries.find((e) => sports.teamMatches(e.game, teamQuery));
    if (!match) {
      const teams = entries.slice(0, 6).map((e) => `${e.game.away?.name} @ ${e.game.home?.name}`).join('\n');
      await interaction.editReply(`Who the hell is "${teamQuery}"? On the board right now:\n${teams}`);
      return;
    }

    const { game, odds } = match;
    const side = sports.teamSide(game, teamQuery);
    const teamName = side === 'home' ? game.home?.name : game.away?.name;
    const price = sports.oddsPrice(odds, side === 'home');
    const payout = sports.payoutFor(amount, price);

    if (!store.takeCoins(interaction.user.id, amount)) {
      await interaction.editReply("You can't afford it. Go claim your daily.");
      return;
    }
    store.placeBet({
      userId: interaction.user.id,
      sport: key,
      gameId: game.id,
      team: teamName,
      side,
      amount,
      price,
    });

    const line = `${teamName} moneyline ${price > 0 ? '+' : ''}${price}`;
    const when = game.state === 'pre' ? sports.fmtDate(game.date) : game.clock;
    await interaction.editReply(
      `Done. ${amount} Carl Coins on ${teamName} (${line}). You win, you get ${payout} back. ${game.away?.name} @ ${game.home?.name} — ${when}`
    );
    return;
  }

  if (commandName === 'ip') {
    await interaction.deferReply();
    const ip = interaction.options.getString('ip');
    try {
      const info = await osint.ipInfo(ip);
      if (info.status !== 'success') {
        await interaction.editReply(`That IP's a dud: ${info.message || 'unknown error'}`);
        return;
      }
      await interaction.editReply(
        `**IP LOOKUP — ${info.query}**\n` +
          `${info.city}, ${info.regionName}, ${info.country} ${info.zip || ''}\n` +
          `Coords: ${info.lat}, ${info.lon}\n` +
          `Timezone: ${info.timezone}\n` +
          `ISP: ${info.isp}\n` +
          `Org: ${info.org || 'none'}\n` +
          `AS: ${info.as}`
      );
    } catch (error) {
      await interaction.editReply(`IP lookup choked: ${error.message}`);
    }
    return;
  }

  if (commandName === 'dns') {
    await interaction.deferReply();
    const domain = interaction.options.getString('domain');
    try {
      const records = await osint.dnsLookup(domain);
      const parts = [];
      for (const type of ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME']) {
        const values = records[type];
        if (!values || !values.length) continue;
        parts.push(`**${type}**\n${values.slice(0, 10).join('\n')}`);
      }
      await interaction.editReply(
        parts.length
          ? `**DNS — ${domain}**\n${parts.join('\n\n')}`
          : `Nothing resolves for ${domain}. Dead domain, like my dreams of going pro.`
      );
    } catch (error) {
      await interaction.editReply(`DNS lookup choked: ${error.message}`);
    }
    return;
  }

  if (commandName === 'whois') {
    await interaction.deferReply();
    const domain = interaction.options.getString('domain');
    try {
      const info = await osint.whois(domain);
      const status = info.status.length ? info.status.slice(0, 6).join(', ') : 'none';
      await interaction.editReply(
        `**WHOIS — ${domain}**\n` +
          `Registrar: ${info.registrar || 'unknown'}\n` +
          `Handle: ${info.handle || 'unknown'}\n` +
          `Created: ${(info.created || 'unknown').slice(0, 10)}\n` +
          `Updated: ${(info.updated || 'unknown').slice(0, 10)}\n` +
          `Expires: ${(info.expires || 'unknown').slice(0, 10)}\n` +
          `Nameservers: ${info.nameservers.length ? info.nameservers.join(', ') : 'none'}\n` +
          `Status: ${status}`
      );
    } catch (error) {
      await interaction.editReply(`WHOIS choked: ${error.message}`);
    }
    return;
  }

  if (commandName === 'pwned') {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const password = interaction.options.getString('password');
    try {
      const count = await osint.pwned(password);
      if (count > 0) {
        await interaction.editReply(
          `That password's been leaked ${count.toLocaleString()} time${count === 1 ? '' : 's'}, ya slob. ` +
            `Change it before Frylock hacks your AOL account.`
        );
      } else {
        await interaction.editReply('Clean. That password aint never been leaked. Impressive, for a guy like you.');
      }
    } catch (error) {
      await interaction.editReply(`Breach check choked: ${error.message}`);
    }
    return;
  }

  if (commandName === 'search') {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    let results;
    try {
      results = await osint.webSearch(query);
    } catch (error) {
      await interaction.editReply(`Search choked: ${error.message}`);
      return;
    }
    if (!results.length) {
      await interaction.editReply(`Nothin' on "${query}". Like my ex-wife's personality, empty.`);
      return;
    }
    const summaryPrompt =
      `Web search results for "${query}":\n\n` +
      results
        .slice(0, 5)
        .map((r, i) => `${i + 1}. ${r.title} — ${r.url}\n   ${r.snippet}`)
        .join('\n\n') +
      '\n\nGive a short Carl-style rundown of these results and recommend the top 1-2 links. 2-3 sentences, in character.';
    try {
      const content = await omniroute.chat([{ role: 'user', content: summaryPrompt }], {
        temperature: 1.0,
        maxTokens: 250,
      });
      await interaction.editReply({
        content: `**SEARCH — "${query}"**\n${content}`,
        allowedMentions: { repliedUser: false },
      });
    } catch {
      const links = results
        .slice(0, 5)
        .map((r) => `**${r.title}**\n${r.url}\n${r.snippet}\n`)
        .join('\n');
      await interaction.editReply(`**SEARCH — "${query}"**\n${links}`);
    }
    return;
  }

  if (commandName === 'lookup') {
    await interaction.deferReply();
    const query = interaction.options.getString('query');
    try {
      const hits = await serverlore.searchServer(client, interaction.guild, query);
      if (!hits.length) {
        await interaction.editReply(
          `Nothin' on "${query}" in recent history. Either it never happened, or Frylock deleted it.`
        );
        return;
      }
      const prompt =
        `People in your Discord server have been talking about "${query}". Here's what was said (channel, who, when):\n\n` +
        hits
          .slice(0, 8)
          .map(
            (h, i) =>
              `${i + 1}. [${h.channel}] ${h.author}: "${h.content}" (${new Date(h.timestamp).toLocaleString()})`
          )
          .join('\n\n') +
        `\n\nSummarize in character as Carl what's going on with "${query}" and how you feel about it. 2-3 sentences, snarky, dismissive, in your voice.`;
      let content;
      try {
        content = await omniroute.chat([{ role: 'user', content: prompt }], {
          temperature: 1.0,
          maxTokens: 200,
        });
      } catch {
        content = hits
          .slice(0, 5)
          .map((h) => `**${h.author}** (${h.channel}): ${h.content}`)
          .join('\n\n');
      }
      await interaction.editReply({
        content: `**SERVER GOSSIP — "${query}"**\n${content}`,
        allowedMentions: { repliedUser: false },
      });
    } catch (error) {
      await interaction.editReply(`Lookup choked: ${error.message}`);
    }
    return;
  }

  if (commandName === 'profile') {
    await interaction.deferReply();
    const user = interaction.options.getUser('user') || interaction.user;
    let member;
    try {
      member = await interaction.guild.members.fetch(user.id);
    } catch {
      await interaction.editReply('That person aint in this server.');
      return;
    }
    const p = serverlore.memberProfile(member);
    const lines = [];
    lines.push(`**${p.displayName}** (${p.tag})`);
    lines.push(`Status: ${p.status}`);
    if (p.activities.length) lines.push(`Doin': ${p.activities.join(', ')}`);
    lines.push(`In the server since: ${p.joinedGuild ? new Date(p.joinedGuild).toDateString() : '? ? ?'}`);
    lines.push(`Discord user since: ${p.joinedDiscord ? new Date(p.joinedDiscord).toDateString() : '? ? ?'}`);
    if (p.topRole && p.topRole !== 'none') lines.push(`Top role: ${p.topRole}`);
    if (p.roles.length) lines.push(`Roles: ${p.roles.join(', ')}`);
    lines.push(p.bot ? "It's a goddamn bot. Doesn't even drink." : 'Human. Barely.');
    await interaction.editReply(lines.join('\n'));
    return;
  }

  if (commandName === 'reminder') {
    const when = interaction.options.getString('when');
    const what = interaction.options.getString('what');
    const target = utility.parseWhen(when);
    if (!target) {
      await interaction.reply(`"${when}"? What kinda time is that? Try "2h", "30m", or "tomorrow".`);
      return;
    }
    await interaction.reply({
      content: `Done. I'll holler at the channel in ${utility.formatUntil(target)}.`,
      flags: MessageFlags.Ephemeral,
    });
    const delay = target.getTime() - Date.now();
    setTimeout(async () => {
      try {
        await interaction.channel.send({
          content: `**REMINDER:** ${what} — ${interaction.user}`,
          allowedMentions: { parse: [] },
        });
      } catch (error) {
        logger.error('reminder send error:', error.message);
      }
    }, Math.max(0, delay));
    return;
  }

  if (commandName === 'deadline') {
    const when = interaction.options.getString('when');
    const task = interaction.options.getString('task');
    const target = utility.parseWhen(when);
    if (!target) {
      await interaction.reply(`"${when}"? Try "friday", "tomorrow", "2026-09-01", or "in 3 days".`);
      return;
    }
    const entry = records.addDeadline({
      userId: interaction.user.id,
      username: interaction.user.username,
      task,
      dueAt: target.getTime(),
      channelId: interaction.channel.id,
    });
    await interaction.reply({
      content: `Deadline set: **${task}** in ${utility.formatUntil(target)}. I'll nag ya. #${entry.id}`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'deadlines') {
    const list = records.listDeadlines();
    if (!list.length) {
      await interaction.reply("Nobody's got any deadlines. Must be nice. Must be unemployed.");
      return;
    }
    const lines = list
      .slice(0, 10)
      .map(
        (d) =>
          `#${d.id} — ${d.task} (${new Date(d.dueAt).toDateString()}, ${utility.formatUntil(new Date(d.dueAt))})`
      );
    await interaction.reply(`**DEADLINES:**\n${lines.join('\n')}\nMark done with /done <id>`);
    return;
  }

  if (commandName === 'done') {
    const id = interaction.options.getInteger('id');
    const entry = records.markDeadlineDone(id);
    if (!entry) {
      await interaction.reply(`Deadline #${id}? I never heard of it. Stop makin' stuff up.`);
      return;
    }
    await interaction.reply(`Deadline "${entry.task}" marked done. I believe you. For now.`);
    return;
  }

  if (commandName === 'bill-split') {
    const amount = interaction.options.getNumber('amount');
    const count = interaction.options.getInteger('count');
    const tip = interaction.options.getNumber('tip') || 0;
    if (!amount || amount <= 0 || !count || count < 1) {
      await interaction.reply('Gimme a real amount and a real headcount.');
      return;
    }
    if (count > 50) {
      await interaction.reply('Fifty people?? Who the hell do you hang out with?');
      return;
    }
    const tipTotal = (amount * tip) / 100;
    const grand = amount + tipTotal;
    const per = grand / count;
    const lines = [];
    lines.push(`**BILL SPLIT — ${count} ways**`);
    lines.push(`Subtotal: $${utility.fmtNum(amount)}`);
    if (tip > 0) lines.push(`Tip (${tip}%): $${utility.fmtNum(tipTotal)}`);
    lines.push(`Grand total: $${utility.fmtNum(grand)}`);
    lines.push(`Each owes: **$${utility.fmtNum(per)}**`);
    lines.push("Now who's payin'? Don't all duck at once.");
    await interaction.reply(lines.join('\n'));
    return;
  }

  if (commandName === 'birthday') {
    const date = interaction.options.getString('date');
    const normalized = utility.validateBirthday(date);
    if (!normalized) {
      await interaction.reply(`"${date}"? Gimme a real date like "8/15" or "aug 15".`);
      return;
    }
    records.addBirthday({
      userId: interaction.user.id,
      username: interaction.user.username,
      date: normalized,
    });
    await interaction.reply({
      content: `Got it — ${interaction.user.username}'s birthday is ${normalized}. I'll make sure to forget it.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (commandName === 'birthdays') {
    const list = records.listBirthdays();
    if (!list.length) {
      await interaction.reply("Nobody's registered a birthday. Sad. Set yours with /birthday <date>.");
      return;
    }
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const lines = sorted.map((b) => `${b.date} — ${b.username}`);
    await interaction.reply(`**BIRTHDAYS:**\n${lines.join('\n')}`);
    return;
  }

  if (commandName === 'nickname') {
    const target = interaction.options.getUser('user');
    const name = interaction.options.getString('name');
    const member = interaction.guild.members.cache.get(target.id);
    if (!member) {
      await interaction.reply('That person aint in this server.');
      return;
    }
    try {
      await member.setNickname(name);
      await interaction.reply(`Renamed ${target.username} to **${name}**. Fits 'em better anyway.`);
    } catch {
      await interaction.reply("Can't do it. I don't have Manage Nicknames permission, or they're higher than me in the pecking order.");
    }
    return;
  }

  if (commandName === 'topic') {
    await interaction.deferReply();
    const starters = [
      "What's the worst hangover you ever had?",
      "If you could only drink one beer forever, which one?",
      "Who here's got the ugliest car? Be honest.",
      "What's a job you'd never do, no matter the pay?",
      "Best concert you ever been to? And no, Wiggles doesn't count.",
      "If you won the lottery tomorrow, what's the first stupid thing you buy?",
      "What's something you're secretly good at?",
      "What's the dumbest thing you ever did for a girl or guy?",
    ];
    if (OMNIROUTE_KEY) {
      try {
        const content = await omniroute.chat(
          [{ role: 'user', content: 'Gimme a random conversation starter for a group of friends in a Discord server. One question, funny, in the spirit of a rowdy bar. No preamble, just the question.' }],
          { temperature: 1.2, maxTokens: 60 }
        );
        await interaction.editReply(`**BAR STOOL TOPIC:** ${content}`);
        return;
      } catch {
        /* fall back */
      }
    }
    await interaction.editReply(`**BAR STOOL TOPIC:** ${starters[Math.floor(Math.random() * starters.length)]}`);
    return;
  }

  if (commandName === 'quote') {
    const target = interaction.options.getUser('user');
    const tag = interaction.options.getString('tag') || null;
    const recent = lore.recentByUser(target.id, 6).filter((m) => m.content);
    if (!recent.length) {
      await interaction.reply(`I got nothin' on ${target.username}. They aint said anything worth remembering.`);
      return;
    }
    const pick = recent[recent.length - 1];
    records.addQuote({
      userId: target.id,
      username: target.username,
      content: pick.content.slice(0, 500),
      channelName: pick.channelName,
      tag,
    });
    await interaction.reply(`Logged ${target.username}'s words for the ages${tag ? ` under "${tag}"` : ''}:\n\n> ${pick.content.slice(0, 500)}`);
    return;
  }

  if (commandName === 'quotes') {
    const tag = interaction.options.getString('tag') || null;
    const list = records.listQuotes(tag);
    if (!list.length) {
      await interaction.reply(tag ? `No quotes tagged "${tag}".` : "No quotes saved. Start with /quote <user>.");
      return;
    }
    const lines = list
      .slice(-8)
      .reverse()
      .map((q) => `${q.username}${q.tag ? ` [${q.tag}]` : ''}: "${q.content}"`);
    await interaction.reply(`**SAVED QUOTES${tag ? ` — ${tag}` : ''}:**\n${lines.join('\n')}`);
    return;
  }

  if (commandName === 'translate') {
    await interaction.deferReply();
    const text = interaction.options.getString('text');
    const lang = interaction.options.getString('lang') || 'english';
    try {
      const content = await omniroute.chat(
        [{ role: 'user', content: `Translate this to ${lang}: "${text}". Only reply with the translation, nothing else.` }],
        { temperature: 0.4, maxTokens: 200 }
      );
      await interaction.editReply(`**${lang.toUpperCase()}:** ${content}`);
    } catch {
      await interaction.editReply("OmniRoute's down, so no translate. You're on your own.");
    }
    return;
  }

  if (commandName === 'unit') {
    const value = interaction.options.getNumber('value');
    const from = interaction.options.getString('from');
    const to = interaction.options.getString('to');
    const result = utility.convertUnit(value, from, to);
    if (!result) {
      await interaction.reply(`"${from}" to "${to}"? That don't convert. Try things like "100 km to miles" or "8 oz to ml" or "50f to c".`);
      return;
    }
    await interaction.reply(`${utility.fmtNum(value)} ${from} = **${utility.fmtNum(result.value)} ${result.unit}** (${result.note})`);
    return;
  }

  if (commandName === 'countdown') {
    const when = interaction.options.getString('when');
    const label = interaction.options.getString('label');
    const target = utility.parseWhen(when);
    if (!target) {
      await interaction.reply(`"${when}"? Try "tomorrow", "friday", "2026-12-25", or "in 3 days".`);
      return;
    }
    const diff = target.getTime() - Date.now();
    if (diff <= 0) {
      await interaction.reply(`That date's already past. ${label || 'It'} came and went. Like my ex.`);
      return;
    }
    await interaction.reply(`**${label || 'COUNTDOWN'}** — ${utility.formatUntil(target)} left.\nSet your clocks, don't be late.`);
    return;
  }

  if (commandName === 'shade') {
    const guild = interaction.guild;
    const targetChannel = interaction.channel;
    const targets = [];
    const excludeIds = [interaction.user.id];
    const named = interaction.options.getUser('target');

    if (named) {
      targets.push(named);
      excludeIds.push(named.id);
    } else {
      const member = pickRandomTarget(guild, excludeIds);
      if (!member) {
        await interaction.reply({
          content: 'Nobody around for me to trash. Dead server, like my marriage.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      targets.push(member.user);
      excludeIds.push(member.id);
    }

    if (targets.length === 1 && Math.random() < 0.35) {
      const extra = pickRandomTarget(guild, excludeIds);
      if (extra) targets.push(extra.user);
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const prompt =
      `You're about to trash-talk people in a Discord channel. Roast them in character as Carl from Aqua Teen Hunger Force. ` +
      (targets.length === 1
        ? `Address the victim as TARGET. `
        : `TARGET is the main victim, TARGET2 gets a side jab. `) +
      `2-3 sentences max, loud, rude, in your voice - bring up beer, the Giants, 2 Wycked, Melon Shakers, or classic rock where it fits. ` +
      `Keep it playful trash talk between friends, don't attack anything real or personal.`;

    let content;
    try {
      content = await omniroute.chat([{ role: 'user', content: prompt }], {
        temperature: 1.15,
        maxTokens: 160,
      });
    } catch (err) {
      logger.error('shade chat error:', err.message);
      await interaction.editReply("OmniRoute's down. Can't talk shit right now.");
      return;
    }

    const target0 = `<@${targets[0].id}>`;
    const target1 = targets[1] ? `<@${targets[1].id}>` : '';
    content = content.replace(/TARGET2/g, target1).replace(/TARGET/g, target0);

    await interaction.editReply("Carl's cookin' somethin' up...");
    const delay = 2500 + Math.random() * 6000;
    setTimeout(async () => {
      try {
        let dest = targetChannel;
        if (!canPost(dest)) {
          dest = getAnnounceChannel();
          if (!canPost(dest)) {
            logger.error('shade: no channel available with Send Messages permission');
            return;
          }
        }
        await dest.send({ content, allowedMentions: { parse: ['users'] } });
      } catch (error) {
        logger.error('shade send error:', error.message);
      }
    }, delay);
    return;
  }
});

client.login(DISCORD_TOKEN).catch((e) => logger.error('Login failed:', e.message));
