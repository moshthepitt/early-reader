// Small helpers shared by the engine and the UI.

// Local calendar date as YYYY-MM-DD. Reviews count by calendar day, not by hours,
// because word learning tracks the number of different days (Childers & Tomasello 2002).
export function dayKey(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}

export function daysBetween(a, b) {
  const [y1, m1, d1] = a.split('-').map(Number);
  const [y2, m2, d2] = b.split('-').map(Number);
  return Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
}

// Monday-based week key, used for "new letters this week".
export function weekStart(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (date.getDay() + 6) % 7;
  return dayKey(new Date(y, m - 1, d - offset));
}

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Seeded random numbers so sessions are reproducible in tests.
export function makeRng(seed = Date.now()) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(arr, rng = Math.random) {
  return arr.length ? arr[Math.floor(rng() * arr.length)] : undefined;
}

export function shuffle(arr, rng = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

export function ageText(birth, now = new Date()) {
  if (!birth) return '';
  const [y, m] = birth.split('-').map(Number);
  const months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (!Number.isFinite(months) || months < 0) return '';
  return `${Math.floor(months / 12)}y ${months % 12}m`;
}

// Replace whole-word, case-insensitive matches of the given names with a placeholder.
export function redactNames(text, names, placeholder = 'the child') {
  let out = String(text || '');
  for (const n of names || []) {
    const name = String(n || '').trim();
    if (name.length < 2) continue;
    const esc = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    out = out.replace(new RegExp(`(^|[^\\p{L}])${esc}(?=$|[^\\p{L}])`, 'giu'), `$1${placeholder}`);
  }
  return out;
}
