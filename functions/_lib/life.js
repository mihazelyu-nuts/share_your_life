// 保存する人生データの検証・整形（想定外のフィールドや巨大な文字列は捨てる）
const S = (v, n) => String(v == null ? '' : v).slice(0, n);

export const MAX_EVENTS = 15;
export const ID_RE = /^[a-z0-9]{6,16}$/;

export function sanitizeLife(x) {
  if (!x || typeof x !== 'object' || !Array.isArray(x.events)) return null;
  const events = x.events.slice(0, MAX_EVENTS).map((e) => {
    e = e && typeof e === 'object' ? e : {};
    const age = parseInt(e.age, 10);
    return {
      age: Number.isFinite(age) ? Math.max(0, Math.min(120, age)) : 0,
      t: S(e.t, 60),
      q: S(e.q, 2000),
      br: !!e.br,
      a: S(e.a, 200),
      ao: S(e.ao, 2000),
      b: S(e.b, 200),
      bo: S(e.bo, 2000),
    };
  });
  if (!events.length) return null;
  const title = S(x.title, 80).trim();
  const ending = S(x.ending, 3000);
  if (!title || !ending.trim()) return null;
  return { title, events, ending, theme: S(x.theme, 16), font: S(x.font, 16) };
}

const ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789'; // 紛らわしい文字(i,l,o,0,1)を除外
export function newId(len = 8) {
  const buf = new Uint32Array(len);
  crypto.getRandomValues(buf);
  return Array.from(buf, (n) => ALPHABET[n % ALPHABET.length]).join('');
}

export async function sha256hex(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}
