# Carl Brutananadilewski Discord Bot

A Discord bot that embodies **Carl Brutananadilewski** from Aqua Teen Hunger Force, powered by **OmniRoute** (OpenAI-compatible AI gateway).

## Features

- **Full Carl Personality**: Vulgar, misanthropic, classic rock loving, Giants/Yankees fan, alcoholic neighbor who's died 70+ times
- **OmniRoute Integration**: Uses any LLM provider through OmniRoute's unified API
- **Conversation Memory**: Maintains context per channel
- **Slash Commands**: `/carl`, `/reset`, `/deaths`, `/car`, `/music`
- **Random Interjections**: 3% chance to chime in unprompted
- **Mention Response**: Always replies when @mentioned

## Setup

### 1. Prerequisites
- Node.js 18+
- Discord Bot Token (from [Discord Developer Portal](https://discord.com/developers/applications))
- OmniRoute running locally or remotely with API key

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

### 4. Run
```bash
npm start
```

## Slash Commands

| Command | Description |
|---------|-------------|
| `/carl [prompt]` | Ask Carl something |
| `/reset` | Clear conversation history |
| `/deaths` | Carl's death count |
| `/car` | About 2 Wycked |
| `/music` | Classic rock talk |

## Carl's Personality

- **Voice**: Thick Boston/NJ working-class accent
- **Vocabulary**: Creative, vulgar profanity
- **Obsessions**: 2 Wycked (car), Foreigner/Boston/Ted Nugent, Giants/Yankees, Melon Shakers, beer
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
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_TOKEN` | Yes | Bot token from Discord Developer Portal |
| `OMNIROUTE_URL` | No | OmniRoute base URL (default: http://localhost:20128) |
| `OMNIROUTE_KEY` | Yes | API key from OmniRoute dashboard |
| `OWNER_ID` | No | Your Discord user ID |

## Deploying

For production, use PM2:
```bash
npm install -g pm2
pm2 start src/index.js --name carl-bot
pm2 startup
pm2 save
```

## License

MIT - Do whatever the fuck you want. Carl don't care.