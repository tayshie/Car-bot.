# Carl Brutananadilewski Discord Bot

A Discord bot that embodies **Carl Brutananadilewski** from Aqua Teen Hunger Force, powered by **OmniRoute** (OpenAI-compatible AI gateway).

Carl's a server insider. He watches everything, remembers everything, bets on games, and will absolutely roast you where you stand.

## Features

### Personality & Chat
- **Full Carl Persona**: Vulgar, misanthropic, classic-rock loving, Giants/Yankees fan, alcoholic neighbor who's died 70+ times
- **OmniRoute Integration**: Uses any LLM provider through OmniRoute's unified API
- **Channel Memory**: Tracks conversation per channel
- **Server Insider**: Logs every message server-wide and backfills channel history on boot (`data/lore.json`) — Carl knows what people say in other channels
- **Context Awareness**: When Carl replies, he's fed recent channel activity + what that person's been up to elsewhere
- **Random Gossip**: On his own schedule, Carl volunteers insider knowledge he "overheard" (`GOSSIP_MIN_HOURS`/`GOSSIP_MAX_HOURS`)
- **Keyword Triggers**: Mentions of beer, the Giants, Melon Shakers, classic rock etc. get Carl to chime in
- **Random Reactions**: Occasionally reacts to messages (8% chance, per-channel cooldown)

### Sports & Carl Coins
- **Live Scores**: NFL, NBA, MLB, UFC/MMA from ESPN (no key required)
- **Real Betting Lines**: Moneyline/spread/totals from The Odds API
- **Carl Coin Economy**: Persistent balances, daily claims, leaderboard
- **Betting**: Place bets with Carl Coins, auto-settled from real game results, winners DM'd

### Server Tools
- **/shade [@user]** — secret command (ephemeral). Carl publicly roasts and pings people so it looks random. Only the caller sees the trigger.
- **/lookup** — search recent server history for people/events
- **/profile** — member dossier (status, roles, join dates)
- **/nickname** — Carl renames people
- **/topic** — bar-stool conversation starter

### OSINT
- **/search** — web search through OmniRoute, summarized in Carl's voice
- **/ip** — IP geolocation, ISP, ASN
- **/dns** — A/AAAA/MX/NS/TXT/CNAME records
- **/whois** — registrar, dates, nameservers, status
- **/pwned** — password breach check (ephemeral, k-anonymity; only the SHA-1 prefix leaves the machine)

### Utilities
- **/reminder** — channel-wide reminder (relative time: "2h", "30m", "tomorrow")
- **/deadline** — persistent deadline Carl nags about (at 1hr-to-go, then every hour overdue); **/deadlines**, **/done**
- **/bill-split** — split bills with tip, down to the cent
- **/birthday /birthdays** — server birthday registry, announced in-channel
- **/quote /quotes** — save and recall people's messages
- **/translate** — translation through OmniRoute
- **/unit** — conversions (length/mass/volume/speed/temp, incl. beers)
- **/countdown** — days/hours until a date

## Setup

### 1. Prerequisites
- Node.js 18+
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- OmniRoute running locally or remotely with API key
- The Odds API key (optional, for real betting lines): https://the-odds-api.com

### 2. Install OmniRoute
```bash
# Local (recommended)
npx omniroute@latest

# Or Docker
docker run -d -p 20128:20128 diegosouzapw/omniroute:latest
```

Get your API key from the OmniRoute dashboard at `http://localhost:20128`

### 3. Configure Bot
```bash
cp .env.example .env
# Edit .env with your tokens
```

### 4. Register Slash Commands
```bash
npm run deploy
```
With `GUILD_ID` set, commands register instantly for that guild. Without it, they register globally (can take up to an hour).

### 5. Run
```bash
npm start
```

### Discord Permissions
Invite the bot with `applications.commands` scope and the following permissions:
- Read Messages / View Channels
- Send Messages
- Manage Nicknames (for `/nickname`)
- Read Message History (for lore backfill, /lookup)
- Add Reactions
- Embed Links

## Slash Commands

### Talking
| Command | Description |
|---------|-------------|
| `/carl [prompt]` | Ask Carl something directly |
| `/reset` | Clear Carl's memory in this channel |
| `/deaths` | Carl's death count |
| `/car` | About 2 Wycked |
| `/music` | Classic rock talk |

### Sports & Money
| Command | Description |
|---------|-------------|
| `/games [sport]` | Today's games and scores (nfl/nba/mlb/mma) |
| `/odds [sport]` | Betting lines right now |
| `/bet <sport> <team> <amount>` | Wager Carl Coins on a game |
| `/balance` | Your Carl Coin balance |
| `/claim` | Daily Carl Coin handout |
| `/leaderboard` | Richest bastards in the server |

### Games
| Command | Description |
|---------|-------------|
| `/blackjack <bet> [opponent1] [opponent2] [opponent3]` | Hit/stand/double vs Carl the dealer. Add up to 3 opponents and you all play at one table against the same dealer, taking turns |
| `/slots <bet>` | Three-reel machine, 2x on pairs, 8-25x on triples (single player) |
| `/dice <bet> [@opponent]` | Roll 2d6. Vs Carl = 2x payout. Add an opponent and you both stake, winner takes the pot |
| `/coin <bet> [heads/tails] [@opponent]` | Flip a coin. Vs Carl = 2x payout. Add an opponent and you both stake, winner takes the pot |
| `/duel <bet> <@user>` | Challenge a member to a coin flip, winner takes the pot |
| `/trivia [category]` | Channel-wide trivia - anyone can answer. Correct banks +100, wrong costs -25 (adult swim / classic rock / juggalo / sports / general) |
| `/cah` | Start a game of Carl's Cards (Cards Against Humanity). Join via button, first to 3 wins. Cards are DM'd privately, card czar picks the winner |

### Server Insider
| Command | Description |
|---------|-------------|
| `/shade [@user]` | Secretly make Carl trash-talk someone (ephemeral trigger, public roast) |
| `/lookup <query>` | Search server history for people/events |
| `/profile [@user]` | Member dossier |
| `/nickname <@user> <name>` | Rename someone |

### OSINT
| Command | Description |
|---------|-------------|
| `/search <query>` | Web search, Carl style |
| `/ip <ip>` | IP geolocation |
| `/dns <domain>` | DNS records |
| `/whois <domain>` | Registration info |
| `/pwned <password>` | Breach check (ephemeral) |

### Utilities
| Command | Description |
|---------|-------------|
| `/reminder <when> <what>` | Channel-wide reminder |
| `/deadline <when> <task>` | Set a nagging deadline |
| `/deadlines` | List open deadlines |
| `/done <id>` | Mark a deadline done |
| `/bill-split <amount> <count> [tip]` | Split a bill |
| `/birthday <date>` | Register your birthday |
| `/birthdays` | List birthdays |
| `/topic` | Conversation starter |
| `/quote <@user> [tag]` | Save a quote |
| `/quotes [tag]` | Show saved quotes |
| `/translate <text> [lang]` | Translate |
| `/unit <value> <from> <to>` | Unit conversion |
| `/countdown <when> [label]` | Countdown to a date |

## Carl's Personality

- **Voice**: Thick Boston/NJ working-class accent
- **Vocabulary**: Creative, vulgar profanity
- **Obsessions**: 2 Wycked (car), Foreigner/Boston/Ted Nugent, Giants/Yankees, Melon Shakers, beer
- **Juggalo**: In the family since the early 90s, hatchet decal on 2 Wycked's rear window, Faygo in the cooler. It's part of him, not his whole act.
- **Trauma**: Made insulation at 8, Berber carpet for Christmas, mother in vet hospital, tiny penis
- **Relationships**: Hates Shake, tolerates Frylock, manipulates Meatwad
- **Deaths**: 70+ canonical deaths (helicopter, lawnmower, electric chair x4, etc.)

## Example Interactions

```
User: @Carl hey
Carl: What. I'm watchin the Giants. They're losin. Again.

User: @Carl what's your favorite song?
Carl: More Than a Feeling. Boston. Greatest song ever written. I seen 'em live. You ain't seen shit.

User: /car
Carl: 2 Wycked. Red Dodge Stealth ES. Spoiler. Chrome rims. Fake hood intake. Stolen 47 times. Current status: probably on blocks in Newark.

User: /unit 100 km to miles
Carl: 100 km = **62.14 miles** (length)
```

## Data Storage

| File | Contents |
|------|----------|
| `data/lore.json` | Server message memory (all channels, per-user) |
| `data/carlcoin.json` | Carl Coin balances and active bets |
| `data/records.json` | Deadlines, birthdays, saved quotes |

All data is local and excluded from git via `.gitignore`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `OMNIROUTE_URL` | No | OmniRoute base URL (default: http://localhost:20128) |
| `OMNIROUTE_KEY` | Yes | API key from OmniRoute dashboard |
| `OMNIROUTE_MODEL` | No | Model to use (default: auto/best-chat). Valid options depend on your provider — try `auto/chat`, `auto/best-fast` |
| `OWNER_ID` | No | Your Discord user ID |
| `GUILD_ID` | No | Guild ID for instant slash command registration |
| `ODDS_API_KEY` | No | The Odds API key for real betting lines |
| `ANNOUNCE_CHANNEL_ID` | No | Channel for game hype + gossip + birthday announcements |
| `CARL_COIN_START` | No | Starting coins (default 1000) |
| `CARL_COIN_CLAIM` | No | Daily claim amount (default 100) |
| `ANNOUNCE_MIN_HOURS` | No | Min hours between game hype (default 2) |
| `ANNOUNCE_MAX_HOURS` | No | Max hours between game hype (default 5) |
| `RESOLVE_MINUTES` | No | How often to settle bets (default 5) |
| `GOSSIP_MIN_HOURS` | No | Min hours between gossip drops (default 2) |
| `GOSSIP_MAX_HOURS` | No | Max hours between gossip drops (default 6) |
| `LORE_CHANNEL_LIMIT` | No | Max stored messages per channel (default 40) |
| `LORE_USER_LIMIT` | No | Max stored messages per user (default 20) |
| `LORE_TOTAL_LIMIT` | No | Max total stored messages (default 5000) |
| `LORE_MAX_USERS` | No | Max tracked users before least-active pruning (default 1000) |
| `LORE_SAVE_INTERVAL_MS` | No | Debounce window for lore disk writes, ms (default 5000) |
| `CONTEXT_CHAR_BUDGET` | No | Max chars of insider context fed to LLM per reply (default 1200) |

## Project Structure

```
ARL/
├── scripts/
│   └── deploy-commands.js   # Slash command registration
├── src/
│   ├── index.js             # Main bot
│   ├── omniroute.js         # OmniRoute chat client
│   ├── carlPrompt.js        # Carl's system prompt
│   ├── sports.js            # ESPN scores + Odds API
│   ├── store.js             # Carl Coin persistence
│   ├── lore.js              # Server memory
│   ├── serverlore.js        # History search + profiles
│   ├── osint.js             # Web search + IP/DNS/WHOIS/pwned
│   ├── records.js           # Deadlines, birthdays, quotes
│   ├── games.js             # Blackjack, slots, dice, coin logic
│   ├── trivia.js            # Trivia question bank
│   ├── cah.js               # Carl's Cards (CAH) deck
│   └── utility.js           # Time parsing, unit conversion
├── data/                    # Local data (gitignored)
├── CARL-INFO.md             # Share-ready command list
└── .env.example
```

## Deploying

For production, use PM2:
```bash
npm install -g pm2
pm2 start src/index.js --name carl-bot
pm2 startup
pm2 save
```

### PM2 Log Rotation

Carl writes a lot (backfills, bet settlements, gossip, every error). Without rotation, stdout logs will eat your disk over months of uptime. Install pm2-logrotate:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'
```
This rotates logs daily (or at 10MB, whichever first), keeps 5 archives, and compresses them.

The bot's own `logs/carl.log` is already self-rotating (keeps ~2000 lines, `LORE_SAVE_INTERVAL_MS` controls write batching).

## License

MIT - Do whatever the fuck you want. Carl don't care.
