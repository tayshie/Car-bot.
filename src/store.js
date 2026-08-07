import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), 'data');
const STORE_FILE = join(DATA_DIR, 'carlcoin.json');

let store = null;

function defaults() {
  return { users: {}, bets: [], nextBetId: 1, started: Date.now() };
}

export function loadStore() {
  if (store) return store;
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (existsSync(STORE_FILE)) {
    try {
      store = JSON.parse(readFileSync(STORE_FILE, 'utf-8'));
    } catch {
      store = defaults();
    }
  } else {
    store = defaults();
  }
  if (!store.users) store.users = {};
  if (!store.bets) store.bets = [];
  if (!store.nextBetId) store.nextBetId = 1;
  if (!store.started) store.started = Date.now();
  return store;
}

export function saveStore() {
  if (!store) return;
  writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

export function getUser(userId, opts = {}) {
  loadStore();
  const create = opts.create ?? false;
  const start = opts.start ?? 1000;
  if (!store.users[userId]) {
    if (!create) return null;
    store.users[userId] = { coins: start, claimedAt: 0 };
    saveStore();
  }
  return store.users[userId];
}

export function addCoins(userId, amount) {
  const user = getUser(userId);
  if (!user) return false;
  user.coins += amount;
  saveStore();
  return true;
}

export function takeCoins(userId, amount) {
  const user = getUser(userId);
  if (!user || user.coins < amount) return false;
  user.coins -= amount;
  saveStore();
  return true;
}

export function placeBet({ userId, sport, gameId, team, side, amount, price }) {
  loadStore();
  const bet = {
    id: store.nextBetId++,
    userId,
    sport,
    gameId,
    team,
    side,
    amount,
    price,
    status: 'open',
    placedAt: Date.now(),
  };
  store.bets.push(bet);
  saveStore();
  return bet;
}

export function pendingBets() {
  loadStore();
  return store.bets.filter((b) => b.status === 'open');
}

export function settleBet(betId, status, payout = 0) {
  loadStore();
  const bet = store.bets.find((b) => b.id === betId);
  if (!bet) return null;
  bet.status = status;
  if (status === 'won') {
    const user = getUser(bet.userId);
    if (user) user.coins += payout;
  } else if (status === 'push') {
    const user = getUser(bet.userId);
    if (user) user.coins += bet.amount;
  }
  bet.payout = payout;
  bet.settledAt = Date.now();
  saveStore();
  return bet;
}

export function leaderboard() {
  loadStore();
  return Object.entries(store.users)
    .map(([userId, u]) => ({ userId, coins: u.coins }))
    .sort((a, b) => b.coins - a.coins);
}
