const MS = {
  sec: 1000,
  min: 60000,
  hour: 3600000,
  day: 86400000,
  week: 604800000,
};

function unitMs(u) {
  if (['s', 'sec', 'second', 'secs', 'seconds'].includes(u)) return MS.sec;
  if (['m', 'min', 'minute', 'mins', 'minutes'].includes(u)) return MS.min;
  if (['h', 'hr', 'hour', 'hrs', 'hours'].includes(u)) return MS.hour;
  if (['d', 'day', 'days'].includes(u)) return MS.day;
  if (['w', 'wk', 'week', 'wks', 'weeks'].includes(u)) return MS.week;
  return null;
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function parseRelative(text) {
  const t = String(text || '').toLowerCase().replace(/^in\s+/, '').trim();
  const m = t.match(/^(\d+(?:\.\d+)?)\s*(second|sec|s|minute|min|m|hour|hr|h|day|d|week|wk|w)s?$/);
  if (!m) return null;
  const mult = unitMs(m[2]);
  if (!mult) return null;
  return Date.now() + parseFloat(m[1]) * mult;
}

export function parseWhen(text) {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;

  let m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d) ? null : d;
  }
  m = t.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (m) {
    let y = m[3] ? +m[3] : new Date().getFullYear();
    if (y < 100) y += 2000;
    const d = new Date(y, +m[1] - 1, +m[2]);
    return isNaN(d) ? null : d;
  }
  if (t === 'tomorrow') {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const di = DAYS.findIndex((d) => t.startsWith(d) || d.startsWith(t));
  if (di >= 0) {
    const d = new Date();
    let add = (di - d.getDay() + 7) % 7;
    if (add === 0) add = 7;
    d.setDate(d.getDate() + add);
    d.setHours(12, 0, 0, 0);
    return d;
  }
  const rel = parseRelative(text);
  if (rel) return new Date(rel);
  return null;
}

export function formatUntil(date) {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 'already past, genius';
  let s = Math.floor(diff / 1000);
  const units = [
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  const parts = [];
  for (const [name, size] of units) {
    const v = Math.floor(s / size);
    if (v > 0) {
      parts.push(`${v} ${name}${v > 1 ? 's' : ''}`);
      s -= v * size;
    }
  }
  return parts.slice(0, 2).join(', ') || 'right about now';
}

const CATEGORIES = {
  length: {
    m: 1, meter: 1, meters: 1, metre: 1,
    km: 1000, kilometer: 1000, kilometers: 1000,
    mile: 1609.344, miles: 1609.344,
    ft: 0.3048, foot: 0.3048, feet: 0.3048,
    in: 0.0254, inch: 0.0254, inches: 0.0254,
    cm: 0.01, mm: 0.001,
  },
  mass: {
    kg: 1, kilo: 1, kilogram: 1, kilograms: 1,
    g: 0.001, gram: 0.001, grams: 0.001,
    lb: 0.45359237, lbs: 0.45359237, pound: 0.45359237, pounds: 0.45359237,
    oz: 0.028349523, ounce: 0.028349523, ounces: 0.028349523,
  },
  volume: {
    l: 1, liter: 1, liters: 1, litre: 1, litres: 1,
    ml: 0.001, milliliter: 0.001, milliliters: 0.001,
    gal: 3.785411784, gallon: 3.785411784, gallons: 3.785411784,
    'fl oz': 0.0295735296, fluidounce: 0.0295735296,
    oz: 0.0295735296, floz: 0.0295735296,
    beer: 0.473176, beers: 0.473176,
  },
  speed: {
    kmh: 1, 'km/h': 1, kph: 1, 'km/hours': 1,
    mph: 1.609344, mps: 3.6, 'm/s': 3.6,
    knots: 1.852, knot: 1.852,
  },
};

function tempConvert(value, from, to) {
  let c;
  switch (from) {
    case 'c': case 'celsius': case 'f': case 'fahrenheit':
      c = from === 'c' || from === 'celsius' ? value : ((value - 32) * 5) / 9;
      break;
    case 'k': case 'kelvin':
      c = value - 273.15;
      break;
    default:
      return null;
  }
  switch (to) {
    case 'c': case 'celsius': return c;
    case 'f': case 'fahrenheit': return (c * 9) / 5 + 32;
    case 'k': case 'kelvin': return c + 273.15;
    default: return null;
  }
}

export function convertUnit(value, from, to) {
  const f = String(from || '').toLowerCase().trim();
  const t = String(to || '').toLowerCase().trim();
  const n = Number(value);
  if (isNaN(n)) return null;

  const temp = tempConvert(n, f, t);
  if (temp !== null) return { value: temp, unit: t, note: 'temperature' };

  for (const [category, table] of Object.entries(CATEGORIES)) {
    if (f in table && t in table) {
      const base = n * table[f];
      return { value: base / table[t], unit: t, note: category };
    }
  }
  return null;
}

export function fmtNum(x) {
  if (!isFinite(x)) return 'infinity';
  const rounded = Math.round(x * 100) / 100;
  return String(rounded).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
}

export function validateBirthday(text) {
  const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  };
  let m = String(text || '').trim().toLowerCase().match(/^(\d{1,2})[/-](\d{1,2})$/);
  let month;
  let day;
  if (m) {
    month = parseInt(m[1], 10);
    day = parseInt(m[2], 10);
  } else {
    m = String(text || '').trim().toLowerCase().match(/^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)(?:uary|ruary|ch|il|e|ust|tember|ober|ember)?[\s.-]+(\d{1,2})$/);
    if (m) {
      month = MONTHS[m[1]];
      day = parseInt(m[2], 10);
    }
  }
  if (!month || month < 1 || month > 12 || !day || day < 1 || day > 31) return null;
  const pad = (x) => String(x).padStart(2, '0');
  return `${pad(month)}-${pad(day)}`;
}
