import { ID_RE } from '../../_lib/life.js';

// GET /api/lives/:id  → 保存された人生のJSON
export async function onRequestGet({ env, params }) {
  const id = String(params.id || '');
  if (!ID_RE.test(id) || !env.LIVES) return new Response('not found', { status: 404 });
  const life = await env.LIVES.get('l:' + id, 'json');
  if (!life) return new Response('not found', { status: 404 });
  return new Response(JSON.stringify(life), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      // IDと内容は不変なので長めにキャッシュしてよい
      'cache-control': 'public, max-age=300',
    },
  });
}
