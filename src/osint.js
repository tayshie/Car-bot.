import { createHash } from 'node:crypto';

const OMNIROUTE_URL = process.env.OMNIROUTE_URL || 'http://localhost:20128';
const OMNIROUTE_KEY = process.env.OMNIROUTE_KEY;

export async function webSearch(query, maxResults = 5) {
  if (!OMNIROUTE_KEY) throw new Error('OMNIROUTE_KEY not set');
  const res = await fetch(`${OMNIROUTE_URL}/v1/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OMNIROUTE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, max_results: maxResults }),
  });
  if (!res.ok) throw new Error(`Search API returned ${res.status}`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    title: r.title || '',
    url: r.url || '',
    snippet: (r.snippet || '').replace(/<[^>]*>/g, ''),
  }));
}

export async function ipInfo(ip) {
  const res = await fetch(
    `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,regionName,city,zip,lat,lon,timezone,isp,org,as,query`
  );
  if (!res.ok) throw new Error('ip-api error');
  return res.json();
}

export async function whois(domain) {
  const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`);
  if (!res.ok) throw new Error(`RDAP returned ${res.status}`);
  const d = await res.json();
  const nameservers = (d.nameservers || []).map((n) => n.ldhName || n.fqdn).filter(Boolean);
  const events = {};
  for (const e of d.events || []) events[e.eventAction] = e.eventDate;
  let registrar = '';
  for (const entity of d.entities || []) {
    if (entity.roles && entity.roles.includes('registrar')) {
      registrar = (entity.vcardArray?.[1] || []).find((i) => i[0] === 'fn')?.[3] || '';
    }
  }
  return {
    handle: d.handle || '',
    registrar,
    created: events.registration || '',
    updated: events.lastChanged || '',
    expires: events.expiration || '',
    nameservers,
    status: d.status || [],
  };
}

export async function dnsLookup(domain) {
  const types = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME'];
  const out = {};
  for (const type of types) {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`);
      if (!res.ok) continue;
      const d = await res.json();
      out[type] = (d.Answer || []).map((a) => a.data);
    } catch {
      /* skip type on failure */
    }
  }
  return out;
}

export async function pwned(password) {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!res.ok) throw new Error('HIBP error');
  const body = await res.text();
  for (const line of body.split('\n')) {
    const [hashSuffix, count] = line.split(':');
    if (hashSuffix.trim().toUpperCase() === suffix) return Number(count);
  }
  return 0;
}
