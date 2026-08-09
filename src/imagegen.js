const BASE_URL = 'https://image.pollinations.ai/prompt';

const MODELS = {
  flux: 'flux',
  realism: 'flux-realism',
  turbo: 'turbo',
  anime: 'anime-diffusion',
  '3d': '3d',
};

const SIZES = {
  square: { width: 1024, height: 1024 },
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
};

export async function generateImage(prompt, { model = 'flux', size = 'square', seed } = {}) {
  const m = MODELS[model] || 'flux';
  const dims = SIZES[size] || SIZES.square;
  const params = new URLSearchParams({
    width: String(dims.width),
    height: String(dims.height),
    model: m,
    nologo: 'true',
  });
  if (seed !== undefined) params.set('seed', String(seed));
  const url = `${BASE_URL}/${encodeURIComponent(prompt)}?${params}`;

  const res = await fetch(url, {
    headers: { Accept: 'image/jpeg,image/png,image/webp' },
    signal: AbortSignal.timeout(90000),
  });
  if (!res.ok) throw new Error(`Pollinations returned ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!buf.length) throw new Error('Pollinations returned an empty image');
  return { buffer: buf, url };
}
