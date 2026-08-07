import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { OmniRouteClient } from './omniroute.js';

const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://localhost:20128';
const OMNIROUTE_KEY = process.env.OMNIROUTE_KEY;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OWNER_ID = process.env.OWNER_ID;

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not set in .env');
  process.exit(1);
}

if (!OMNIROUTE_KEY) {
  console.warn('OMNIROUTE_KEY not set - bot will not be able to respond');
}

const omniroute = new OmniRouteClient(OMNIROUTE_URL, OMNIROUTE_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const conversationHistory = new Map();
const MAX_HISTORY = 10;

function getHistory(channelId) {
  if (!conversationHistory.has(channelId)) {
    conversationHistory.set(channelId, []);
  }
  return conversationHistory.get(channelId);
}

function addToHistory(channelId, role, content) {
  const history = getHistory(channelId);
  history.push({ role, content });
  if (history.length > MAX_HISTORY * 2) {
    history.splice(0, history.length - MAX_HISTORY * 2);
  }
}

function shouldRespond(message) {
  if (message.author.bot) return false;
  if (message.mentions.has(client.user)) return true;
  if (message.content.toLowerCase().includes('carl')) return true;
  if (message.channel.type === 1) return true; // DM
  return Math.random() < 0.03; // 3% chance to randomly chime in
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`OmniRoute: ${OMNIROUTE_URL}`);
  
  client.user.setActivity('2 Wycked | Foreigner | Giants', { type: 2 }); // LISTENING
});

client.on(Events.MessageCreate, async (message) => {
  if (!shouldRespond(message)) return;
  if (!OMNIROUTE_KEY) {
    await message.reply('OmniRoute key not configured. Tell my old man to set it up.');
    return;
  }

  const channelId = message.channel.id;
  const userMessage = message.content.replace(`<@${client.user.id}>`, '').trim();

  addToHistory(channelId, 'user', userMessage);

  try {
    const history = getHistory(channelId);
    const response = await omniroute.chat(history, {
      temperature: 0.95,
      maxTokens: 400,
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
    console.error('OmniRoute error:', error);
    const errors = [
      'OmniRoute\'s takin a shit. Try again later.',
      'The goddamn API\'s down. Like my car. Always broken.',
      'Frylock\'s experiments fucked up the connection again.',
      'Error. Whatever. I\'m goin to Melon Shakers.',
    ];
    await message.reply({ content: errors[Math.floor(Math.random() * errors.length)], allowedMentions: { repliedUser: false } });
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'carl') {
    const prompt = interaction.options.getString('prompt') || 'Say something';
    addToHistory(interaction.channelId, 'user', prompt);
    
    try {
      const history = getHistory(interaction.channelId);
      const response = await omniroute.chat(history, { temperature: 0.95, maxTokens: 400 });
      addToHistory(interaction.channelId, 'assistant', response);
      await interaction.reply({ content: response, allowedMentions: { repliedUser: false } });
    } catch (error) {
      await interaction.reply({ content: 'OmniRoute\'s down. Like my transmission.', flags: MessageFlags.Ephemeral });
    }
  }

  if (commandName === 'reset') {
    conversationHistory.delete(interaction.channelId);
    await interaction.reply({ content: 'History wiped. Like my memory after 18 beers.', flags: MessageFlags.Ephemeral });
  }

  if (commandName === 'deaths') {
    const deathCount = 70;
    await interaction.reply({ content: `I died ${deathCount} times. Last week a helicopter shredded me. Tuesday a lawnmower got my head. Monday it was the electric chair. Again.`, flags: MessageFlags.Ephemeral });
  }

  if (commandName === 'car') {
    await interaction.reply({ content: '2 Wycked. Red Dodge Stealth ES. Spoiler. Chrome rims. Fake hood intake. Stolen 47 times. Current status: probably on blocks in Newark.', flags: MessageFlags.Ephemeral });
  }

  if (commandName === 'music') {
    const bands = ['Foreigner', 'Loverboy', 'Judas Priest', 'Krokus', 'Bryan Adams', 'Boston', 'Ted Nugent', 'Led Zeppelin', 'Foghat'];
    const band = bands[Math.floor(Math.random() * bands.length)];
    await interaction.reply({ content: `${band}. Seen 'em live. You ain't seen shit until you seen Nugent in a loincloth at Cat Scratch Fever tour.`, flags: MessageFlags.Ephemeral });
  }
});

client.login(DISCORD_TOKEN).catch(console.error);