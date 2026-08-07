const LEAGUES = {
  nfl: { espn: 'football/nfl', oddsKey: 'americanfootball_nfl', label: 'NFL' },
  nba: { espn: 'basketball/nba', oddsKey: 'basketball_nba', label: 'NBA' },
  mlb: { espn: 'baseball/mlb', oddsKey: 'baseball_mlb', label: 'MLB' },
  mma: { espn: 'mma/ufc', oddsKey: 'mma_mixed_martial_arts', label: 'UFC/MMA' },
};

export const SPORT_KEYS = Object.keys(LEAGUES);
export const SPORT_LABELS = LEAGUES;

const cache = { scoreboard: {}, odds: {} };
const SCORE_TTL = 60000;
const ODDS_TTL = 600000;

export async function getScoreboard(key) {
  const now = Date.now();
  const hit = cache.scoreboard[key];
  if (hit && now - hit.at < SCORE_TTL) return hit.data;
  const league = LEAGUES[key];
  if (!league) return hit ? hit.data : [];
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league.espn}/scoreboard`);
    if (!res.ok) return hit ? hit.data : [];
    const data = await res.json();
    const mapped = (data.events || []).map(mapEvent);
    cache.scoreboard[key] = { at: now, data: mapped };
    return mapped;
  } catch {
    return hit ? hit.data : [];
  }
}

function mapEvent(ev) {
  const comp = ev.competitions?.[0] || {};
  const competitors = (comp.competitors || []).map((c) => ({
    homeAway: c.homeAway,
    name: c.team?.displayName || c.team?.name || c.team?.location || 'Unknown',
    abbrev: c.team?.abbreviation || c.team?.shortDisplayName || '',
    score: c.score || null,
    winner: !!c.winner,
  }));
  return {
    id: String(ev.id),
    name: ev.name || ev.shortName || '',
    date: ev.date || '',
    state: ev.status?.type?.state || 'pre',
    completed: !!ev.status?.type?.completed,
    clock: ev.status?.type?.description || '',
    home: competitors.find((c) => c.homeAway === 'home') || null,
    away: competitors.find((c) => c.homeAway === 'away') || null,
  };
}

export async function getOdds(key) {
  const now = Date.now();
  const hit = cache.odds[key];
  if (hit && now - hit.at < ODDS_TTL) return hit.data;
  const apiKey = process.env.ODDS_API_KEY;
  const league = LEAGUES[key];
  if (!apiKey || !league) return hit ? hit.data : null;
  try {
    const params = new URLSearchParams({
      apiKey,
      regions: 'us',
      markets: 'h2h,spreads,totals',
      oddsFormat: 'american',
    });
    const res = await fetch(`https://api.the-odds-api.com/v4/sports/${league.oddsKey}/odds/?${params}`);
    if (!res.ok) return hit ? hit.data : null;
    const data = await res.json();
    const map = {};
    for (const game of data) {
      const bm = bestBookmaker(game);
      if (!bm) continue;
      const markets = {};
      for (const m of bm.markets || []) markets[m.key] = m.outcomes;
      map[`${game.away_team}@${game.home_team}`] = {
        away: game.away_team,
        home: game.home_team,
        commenceTime: game.commence_time,
        h2h: toMap(markets.h2h),
        spreads: toMap(markets.spreads),
        totals: toMap(markets.totals),
      };
    }
    cache.odds[key] = { at: now, data: map };
    return map;
  } catch {
    return hit ? hit.data : null;
  }
}

function bestBookmaker(game) {
  let best = null;
  for (const bm of game.bookmakers || []) {
    const count = (bm.markets || []).length;
    if (!best || count > best.count) best = { bm, count };
  }
  return best ? best.bm : null;
}

function toMap(outcomes) {
  const map = {};
  for (const o of outcomes || []) map[o.name] = o;
  return map;
}

export async function upcomingGames(key) {
  const [games, odds] = await Promise.all([getScoreboard(key), getOdds(key)]);
  const oddsByTeam = new Map();
  if (odds) {
    for (const g of Object.values(odds)) {
      oddsByTeam.set(norm(g.away), g);
      oddsByTeam.set(norm(g.home), g);
    }
  }
  return games
    .filter((g) => g.state !== 'post')
    .map((game) => {
      const match =
        oddsByTeam.get(norm(game.home?.name)) ||
        oddsByTeam.get(norm(game.away?.name)) ||
        null;
      return { game, odds: match };
    });
}

function norm(s) {
  return (s || '').toLowerCase().trim();
}

export function teamMatches(game, query) {
  const q = norm(query);
  if (!q) return false;
  for (const c of [game.home, game.away]) {
    if (!c) continue;
    if (norm(c.name) === q) return true;
    if (norm(c.name).includes(q)) return true;
    if (c.abbrev && norm(c.abbrev) === q) return true;
  }
  return false;
}

export function teamSide(game, query) {
  const q = norm(query);
  if (game.home && (norm(game.home.name).includes(q) || (game.home.abbrev && norm(game.home.abbrev) === q))) {
    return 'home';
  }
  return 'away';
}

export function oddsPrice(odds, isHome) {
  if (!odds) return -110;
  const name = isHome ? odds.home : odds.away;
  const entry = odds.h2h[name];
  return entry && entry.price ? Number(entry.price) : -110;
}

export function lineDescription(game, odds) {
  if (!odds) return 'Moneyline open — lines TBD';
  const home = odds.h2h[odds.home];
  const away = odds.h2h[odds.away];
  const spread = odds.spreads[odds.home] || odds.spreads[odds.away];
  const total = odds.totals['Over'];
  const parts = [];
  if (away && home) parts.push(`${odds.away} ${fmtNum(away.price)} / ${odds.home} ${fmtNum(home.price)}`);
  if (spread) parts.push(`${spread.name} ${fmtNum(spread.point)}`);
  if (total) parts.push(`O/U ${total.point} (${fmtNum(total.price)})`);
  return parts.join(' | ') || 'Moneyline open — lines TBD';
}

export function determineWinner(game) {
  const hs = Number(game.home?.score ?? NaN);
  const as = Number(game.away?.score ?? NaN);
  if (!Number.isNaN(hs) && !Number.isNaN(as)) {
    if (hs === as) return null;
    return hs > as ? 'home' : 'away';
  }
  if (game.home?.winner && game.away?.winner) {
    if (game.home.winner) return 'home';
    if (game.away.winner) return 'away';
  }
  return null;
}

export function payoutFor(amount, price) {
  let profit;
  if (price >= 0) profit = amount * (price / 100);
  else profit = amount / (Math.abs(price) / 100);
  return Math.round(amount + profit);
}

export function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function fmtNum(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return (n > 0 ? '+' : '') + n;
}
