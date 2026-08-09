export function createDeck() {
  const suits = ['♠', '♥', '♦', '♣'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck = [];
  for (const suit of suits) {
    for (const rank of ranks) deck.push({ suit, rank });
  }
  return deck;
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function cardValue(rank) {
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

export function handValue(hand) {
  let total = 0;
  let aces = 0;
  for (const c of hand) {
    total += cardValue(c.rank);
    if (c.rank === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export function handLabel(hand) {
  return hand.map((c) => `${c.rank}${c.suit}`).join(' ');
}

export function isBlackjack(hand) {
  return hand.length === 2 && handValue(hand) === 21;
}

export function rollDice(n = 2) {
  let total = 0;
  for (let i = 0; i < n; i++) total += 1 + Math.floor(Math.random() * 6);
  return total;
}

const SLOT_POOL = ['🍺', '7', '💵', '🤡', '🪓', '🏈', '🔔'];

function pickSymbol() {
  return SLOT_POOL[Math.floor(Math.random() * SLOT_POOL.length)];
}

export function spinSlots() {
  const reels = [pickSymbol(), pickSymbol(), pickSymbol()];
  let multiplier = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    multiplier = reels[0] === '7' ? 25 : reels[0] === '🤡' ? 12 : 8;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    multiplier = 2;
  }
  return { reels, multiplier };
}

export function flipCoin() {
  return Math.random() < 0.5 ? 'HEADS' : 'TAILS';
}
