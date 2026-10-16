import { ID_RE } from '../_lib/life.js';

const attr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// GET /l/:id  → index.html を返しつつ、その人生のタイトルをXなどのプレビュー用タグに埋め込む
export async function onRequestGet({ request, env, params }) {
  const id = String(params.id || '');
  const page = await env.ASSETS.fetch(new Request(new URL('/', request.url)));

  let life = null;
  if (ID_RE.test(id) && env.LIVES) {
    try { life = await env.LIVES.get('l:' + id, 'json'); } catch { /* 取得失敗は404扱い */ }
  }

  if (!life) {
    // アプリ本体は返す（画面側で「見つかりませんでした」を表示する）
    return new Response(page.body, {
      status: 404,
      headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const last = life.events[life.events.length - 1].age;
  const title = `『${life.title}』｜1分の1の人生`;
  const desc = `0〜${last}歳・出来事${life.events.length}個。選んだ道は違っても、たどり着く先はひとつ。`;
  const url = `${new URL(request.url).origin}/l/${id}`;

  const meta =
    `<meta property="og:type" content="website">` +
    `<meta property="og:site_name" content="1分の1の人生">` +
    `<meta property="og:title" content="${attr(title)}">` +
    `<meta property="og:description" content="${attr(desc)}">` +
    `<meta property="og:url" content="${attr(url)}">` +
    `<meta name="twitter:card" content="summary">` +
    `<meta name="twitter:title" content="${attr(title)}">` +
    `<meta name="twitter:description" content="${attr(desc)}">` +
    `<meta name="description" content="${attr(desc)}">`;

  const res = new HTMLRewriter()
    .on('title', { element(e) { e.setInnerContent(title); } })
    .on('head', { element(e) { e.append(meta, { html: true }); } })
    .transform(page);

  const out = new Response(res.body, res);
  out.headers.set('content-type', 'text/html; charset=utf-8');
  out.headers.set('cache-control', 'public, max-age=300');
  return out;
}
