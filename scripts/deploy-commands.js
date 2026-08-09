import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN) {
  console.error('DISCORD_TOKEN not set in .env');
  process.exit(1);
}

const sportChoices = [
  { name: 'NFL', value: 'nfl' },
  { name: 'NBA', value: 'nba' },
  { name: 'MLB', value: 'mlb' },
  { name: 'UFC/MMA', value: 'mma' },
];

const commands = [
  {
    name: 'carl',
    description: 'Ask Carl something',
    options: [
      {
        name: 'prompt',
        description: 'What do you wanna say to Carl?',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'reset',
    description: "Clear Carl's memory in this channel",
  },
  {
    name: 'deaths',
    description: 'How many times has Carl died?',
  },
  {
    name: 'car',
    description: 'Ask about 2 Wycked',
  },
  {
    name: 'music',
    description: "Carl's classic rock talk",
  },
  {
    name: 'games',
    description: "Today's games and scores",
    options: [
      {
        name: 'sport',
        description: 'Which sport?',
        type: 3,
        required: false,
        choices: sportChoices,
      },
    ],
  },
  {
    name: 'odds',
    description: 'Betting lines right now',
    options: [
      {
        name: 'sport',
        description: 'Which sport?',
        type: 3,
        required: false,
        choices: sportChoices,
      },
    ],
  },
  {
    name: 'bet',
    description: 'Put Carl Coins on a game',
    options: [
      {
        name: 'sport',
        description: 'Which sport?',
        type: 3,
        required: true,
        choices: sportChoices,
      },
      {
        name: 'team',
        description: 'Team or fighter name',
        type: 3,
        required: true,
      },
      {
        name: 'amount',
        description: 'Carl Coins to wager',
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: 'balance',
    description: 'Your Carl Coin balance',
  },
  {
    name: 'claim',
    description: 'Daily Carl Coin handout',
  },
  {
    name: 'leaderboard',
    description: 'Richest bastards in the server',
  },
  {
    name: 'blackjack',
    description: 'Play blackjack against Carl (or with friends)',
    options: [
      {
        name: 'bet',
        description: 'Carl Coins to wager',
        type: 4,
        required: true,
      },
      {
        name: 'opponent1',
        description: 'Optional player 2 at the table',
        type: 6,
        required: false,
      },
      {
        name: 'opponent2',
        description: 'Optional player 3 at the table',
        type: 6,
        required: false,
      },
      {
        name: 'opponent3',
        description: 'Optional player 4 at the table',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'slots',
    description: 'Spin the Carl Coin slot machine',
    options: [
      {
        name: 'bet',
        description: 'Carl Coins to wager',
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: 'dice',
    description: 'Roll dice against Carl or another member',
    options: [
      {
        name: 'bet',
        description: 'Carl Coins to wager',
        type: 4,
        required: true,
      },
      {
        name: 'opponent',
        description: 'Challenge a member instead of Carl',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'coin',
    description: 'Flip a coin against Carl or another member',
    options: [
      {
        name: 'bet',
        description: 'Carl Coins to wager',
        type: 4,
        required: true,
      },
      {
        name: 'call',
        description: 'Heads or tails',
        type: 3,
        required: false,
        choices: [
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' },
        ],
      },
      {
        name: 'opponent',
        description: 'Challenge a member instead of Carl',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'duel',
    description: 'Challenge a member to a coin duel',
    options: [
      {
        name: 'bet',
        description: 'Carl Coins each side stakes',
        type: 4,
        required: true,
      },
      {
        name: 'user',
        description: 'Who you challengin?',
        type: 6,
        required: true,
      },
    ],
  },
  {
    name: 'trivia',
    description: 'Carl trivia - win coins, lose dignity',
    options: [
      {
        name: 'category',
        description: 'Pick a category',
        type: 3,
        required: false,
        choices: [
          { name: 'Any', value: 'any' },
          { name: 'Adult Swim', value: 'adult swim' },
          { name: 'Classic Rock', value: 'classic rock' },
          { name: 'Juggalo', value: 'juggalo' },
          { name: 'Sports', value: 'sports' },
          { name: 'General', value: 'general' },
        ],
      },
    ],
  },
  {
    name: 'cah',
    description: "Start a game of Carl's Cards (Cards Against Humanity style)",
  },
  {
    name: 'search',
    description: 'Web search, Carl style',
    options: [
      {
        name: 'query',
        description: 'What ya wanna look up?',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'ip',
    description: 'Look up an IP address',
    options: [
      {
        name: 'ip',
        description: 'IP address to lookup',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'dns',
    description: 'DNS records for a domain',
    options: [
      {
        name: 'domain',
        description: 'Domain to resolve',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'whois',
    description: 'Who owns a domain?',
    options: [
      {
        name: 'domain',
        description: 'Domain to look up',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'pwned',
    description: 'Check if your password was leaked (private)',
    options: [
      {
        name: 'password',
        description: 'Password to check - never stored',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'shade',
    description: 'Secretly make Carl trash-talk someone (only you see this)',
    options: [
      {
        name: 'target',
        description: 'Who to roast (random if left blank)',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'lookup',
    description: "Search the server's history for people or events",
    options: [
      {
        name: 'query',
        description: 'Who or what are ya diggin for?',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'profile',
    description: "Look at someone's server info",
    options: [
      {
        name: 'user',
        description: 'Who to look up (defaults to you)',
        type: 6,
        required: false,
      },
    ],
  },
  {
    name: 'reminder',
    description: 'Set a channel-wide reminder',
    options: [
      {
        name: 'when',
        description: 'When? e.g. "2h", "30m", "tomorrow"',
        type: 3,
        required: true,
      },
      {
        name: 'what',
        description: 'What to remind everyone about',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'deadline',
    description: "Set a deadline Carl will nag about",
    options: [
      {
        name: 'when',
        description: 'e.g. "friday", "tomorrow", "2026-09-01", "in 3 days"',
        type: 3,
        required: true,
      },
      {
        name: 'task',
        description: 'What needs doing',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'deadlines',
    description: 'List all open deadlines',
  },
  {
    name: 'done',
    description: 'Mark a deadline as done',
    options: [
      {
        name: 'id',
        description: 'Deadline # from /deadlines',
        type: 4,
        required: true,
      },
    ],
  },
  {
    name: 'bill-split',
    description: 'Split a bill evenly',
    options: [
      {
        name: 'amount',
        description: 'Total bill amount',
        type: 10,
        required: true,
      },
      {
        name: 'count',
        description: 'How many people',
        type: 4,
        required: true,
      },
      {
        name: 'tip',
        description: 'Tip percent (optional)',
        type: 10,
        required: false,
      },
    ],
  },
  {
    name: 'birthday',
    description: 'Register your birthday',
    options: [
      {
        name: 'date',
        description: 'e.g. "8/15" or "aug 15"',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'birthdays',
    description: 'List registered birthdays',
  },
  {
    name: 'nickname',
    description: 'Carl renames someone',
    options: [
      {
        name: 'user',
        description: 'Who gets renamed',
        type: 6,
        required: true,
      },
      {
        name: 'name',
        description: 'New nickname',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'topic',
    description: 'Random bar-stool conversation starter',
  },
  {
    name: 'quote',
    description: 'Save someone\u2019s recent message as a quote',
    options: [
      {
        name: 'user',
        description: 'Whose words to save',
        type: 6,
        required: true,
      },
      {
        name: 'tag',
        description: 'Optional tag to organize quotes',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'quotes',
    description: 'Show saved quotes',
    options: [
      {
        name: 'tag',
        description: 'Filter by tag',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'translate',
    description: 'Translate something through Carl',
    options: [
      {
        name: 'text',
        description: 'What to translate',
        type: 3,
        required: true,
      },
      {
        name: 'lang',
        description: 'Target language (default english)',
        type: 3,
        required: false,
      },
    ],
  },
  {
    name: 'unit',
    description: 'Unit conversion',
    options: [
      {
        name: 'value',
        description: 'The number',
        type: 10,
        required: true,
      },
      {
        name: 'from',
        description: 'e.g. km, miles, kg, lb, oz, f',
        type: 3,
        required: true,
      },
      {
        name: 'to',
        description: 'e.g. miles, km, lb, ml, c',
        type: 3,
        required: true,
      },
    ],
  },
  {
    name: 'countdown',
    description: 'Countdown to a date',
    options: [
      {
        name: 'when',
        description: 'e.g. "2026-12-25", "friday", "in 3 days"',
        type: 3,
        required: true,
      },
      {
        name: 'label',
        description: 'What is it?',
        type: 3,
        required: false,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

function clientIdFromToken(token) {
  return Buffer.from(token.split('.')[0], 'base64url').toString('utf-8');
}

(async () => {
  try {
    const clientId = clientIdFromToken(DISCORD_TOKEN);
    console.log(`Registering ${commands.length} slash commands...`);

    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(clientId, GUILD_ID), { body: commands });
      console.log(`Commands registered for guild ${GUILD_ID} (instant).`);
      return;
    }

    const guilds = await rest.get(Routes.userGuilds());
    const adminGuilds = guilds.filter((g) => (Number(g.permissions) & 0x20) === 0x20);

    if (adminGuilds.length === 0) {
      console.log('No guilds found where the bot has Manage Server permissions.');
      console.log('Registering globally instead (can take up to an hour).');
      await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log('Commands registered globally.');
      return;
    }

    for (const guild of adminGuilds) {
      await rest.put(Routes.applicationGuildCommands(clientId, guild.id), { body: commands });
      console.log(`Commands registered for guild "${guild.name}" (${guild.id}) - instant.`);
    }
  } catch (error) {
    console.error('Failed to register commands:', error);
    process.exit(1);
  }
})();
