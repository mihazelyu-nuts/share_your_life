import { sanitizeLife, newId, sha256hex, ID_RE } from '../_lib/life.js';

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

// POST /api/lives  → { id }  人生を保存して短いIDを発行する
export async function onRequestPost({ request, env }) {
  if (!env.LIVES) return json({ error: 'KV binding "LIVES" is not configured' }, 500);

  // 他サイトからの書き込みを防ぐ（同一オリジンのみ許可）
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return json({ error: 'forbidden' }, 403);
  }

  const text = await request.text();
  if (text.length > 60000) return json({ error: 'too large' }, 413);
  let raw;
  try { raw = JSON.parse(text); } catch { return json({ error: 'invalid json' }, 400); }
  const life = sanitizeLife(raw);
  if (!life) return json({ error: 'invalid life' }, 400);

  const body = JSON.stringify(life);

  // 同じ内容なら同じIDを返す（連打・再共有で増殖させない）
  const hkey = 'h:' + (await sha256hex(body)).slice(0, 32);
  const existing = await env.LIVES.get(hkey);
  if (existing && ID_RE.test(existing)) return json({ id: existing });

  let id = null;
  for (let i = 0; i < 5; i++) {
    const cand = newId(8);
    if (!(await env.LIVES.get('l:' + cand))) { id = cand; break; }
  }
  if (!id) return json({ error: 'try again' }, 503);

  await env.LIVES.put('l:' + id, body);
  await env.LIVES.put(hkey, id);
  return json({ id }, 201);
}
