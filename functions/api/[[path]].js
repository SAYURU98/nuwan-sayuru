// Portfolio API on Cloudflare Pages Functions. Bindings: DB (D1), FILES (KV).
const J = (d, s = 200, h = {}) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });
const bad = (m, s = 400) => J({ error: m }, s);
const enc = new TextEncoder();
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
const sha256 = async s => hex(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

async function pbkdf2(pw, saltB64, iter) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unb64(saltB64), iterations: iter }, key, 256));
}
function same(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

async function limited(env, ip, kind, max, windowSec) {
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare('DELETE FROM hits WHERE at < ?').bind(now - 86400).run();
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM hits WHERE ip=? AND kind=? AND at>?').bind(ip, kind, now - windowSec).first();
  if (n >= max) return true;
  await env.DB.prepare('INSERT INTO hits (ip, kind, at) VALUES (?,?,?)').bind(ip, kind, now).run();
  return false;
}
async function authed(request, env) {
  const t = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!t) return false;
  const row = await env.DB.prepare('SELECT expires_at FROM sessions WHERE token_hash=?').bind(await sha256(t)).first();
  return !!row && row.expires_at > Math.floor(Date.now() / 1000);
}
async function getContent(env) {
  const r = await env.DB.prepare('SELECT data, updated_at FROM site_content WHERE id=1').first();
  return { data: r ? JSON.parse(r.data || '{}') : {}, updated_at: r && r.updated_at };
}

export async function onRequest({ request, env, params }) {
  const path = (params.path || []).join('/');
  const m = request.method;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(m) && (request.headers.get('content-type') || '').includes('json')) {
    try { body = await request.json(); } catch { return bad('Invalid JSON'); }
  }
  try {
    /* ---------- public ---------- */
    if (path === 'content' && m === 'GET') return J(await getContent(env), 200, { 'cache-control': 'public, max-age=30' });

    if (path === 'endorsements' && m === 'GET') {
      const { results } = await env.DB.prepare("SELECT id,name,role,company,relation,message,created_at FROM endorsements WHERE status='approved' ORDER BY created_at DESC LIMIT 200").all();
      return J(results);
    }
    if (path === 'endorsements' && m === 'POST') {
      if (body.website) return J({ ok: true });                       // honeypot
      const name = clip(body.name, 80), message = clip(body.message, 800);
      if (!name || message.length < 20) return bad('Add your name and at least a sentence or two.');
      if (await limited(env, ip, 'endorse', 3, 3600)) return bad('Too many submissions. Try again in an hour.', 429);
      await env.DB.prepare('INSERT INTO endorsements (name,role,company,relation,link,message,ip) VALUES (?,?,?,?,?,?,?)')
        .bind(name, clip(body.role, 80), clip(body.company, 80), clip(body.relation, 40), clip(body.link, 200), message, ip).run();
      return J({ ok: true });
    }
    if (path === 'messages' && m === 'POST') {
      if (body.website) return J({ ok: true });
      const name = clip(body.name, 80), message = clip(body.message, 4000);
      if (!name || !message) return bad('Add your name and a message.');
      if (await limited(env, ip, 'message', 6, 3600)) return bad('Too many messages. Try again in an hour.', 429);
      await env.DB.prepare('INSERT INTO messages (kind,name,email,message,ip) VALUES (?,?,?,?,?)')
        .bind(clip(body.kind, 40), name, clip(body.email, 120), message, ip).run();
      return J({ ok: true });
    }

    /* ---------- admin ---------- */
    if (path === 'admin/login' && m === 'POST') {
      if (await limited(env, ip, 'login', 8, 3600)) return bad('Too many attempts. Try again later.', 429);
      const a = await env.DB.prepare('SELECT salt,hash,iterations FROM admin WHERE id=1').first();
      if (!a || !same(await pbkdf2(String(body.password || ''), a.salt, a.iterations), a.hash)) return bad('Wrong password.', 401);
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      await env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run();
      await env.DB.prepare('INSERT INTO sessions (token_hash, expires_at) VALUES (?,?)').bind(await sha256(token), Math.floor(Date.now() / 1000) + 7 * 86400).run();
      return J({ token });
    }
    if (path.startsWith('admin/')) {
      if (!(await authed(request, env))) return bad('Sign in again.', 401);
      const [, what, id] = path.split('/');

      if (what === 'logout' && m === 'POST') {
        const t = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
        await env.DB.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await sha256(t)).run();
        return J({ ok: true });
      }
      if (what === 'password' && m === 'POST') {
        const a = await env.DB.prepare('SELECT salt,hash,iterations FROM admin WHERE id=1').first();
        if (!same(await pbkdf2(String(body.current || ''), a.salt, a.iterations), a.hash)) return bad('Current password is wrong.', 401);
        if (String(body.next || '').length < 12) return bad('Use at least 12 characters.');
        const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
        await env.DB.prepare('UPDATE admin SET salt=?, hash=?, iterations=100000 WHERE id=1').bind(salt, await pbkdf2(body.next, salt, 100000)).run();
        return J({ ok: true });
      }
      if (what === 'endorsements') {
        if (m === 'GET') { const { results } = await env.DB.prepare('SELECT * FROM endorsements ORDER BY created_at DESC LIMIT 500').all(); return J(results); }
        if (m === 'PATCH' && id) { const s = body.status; if (!['approved', 'rejected', 'pending'].includes(s)) return bad('Unknown status');
          await env.DB.prepare('UPDATE endorsements SET status=? WHERE id=?').bind(s, id).run(); return J({ ok: true }); }
        if (m === 'DELETE' && id) { await env.DB.prepare('DELETE FROM endorsements WHERE id=?').bind(id).run(); return J({ ok: true }); }
      }
      if (what === 'messages') {
        if (m === 'GET') { const { results } = await env.DB.prepare('SELECT * FROM messages ORDER BY created_at DESC LIMIT 500').all(); return J(results); }
        if (m === 'DELETE' && id) { await env.DB.prepare('DELETE FROM messages WHERE id=?').bind(id).run(); return J({ ok: true }); }
      }
      if (what === 'content' && m === 'PUT') {
        if (!body.data || typeof body.data !== 'object') return bad('Send { data: {...} }');
        await env.DB.prepare("UPDATE site_content SET data=?, updated_at=datetime('now'), updated_by='admin' WHERE id=1").bind(JSON.stringify(body.data)).run();
        return J({ ok: true });
      }
      if (what === 'file' && m === 'PUT' && ['cv', 'photo'].includes(id)) {
        const type = request.headers.get('content-type') || '';
        const ok = id === 'cv' ? type === 'application/pdf' : /^image\/(jpeg|png|webp)$/.test(type);
        if (!ok) return bad(id === 'cv' ? 'Upload a PDF.' : 'Upload a JPG, PNG or WebP image.');
        const buf = await request.arrayBuffer();
        if (buf.byteLength > 8 * 1024 * 1024) return bad('File is larger than 8 MB.');
        const updated = new Date().toISOString();
        await env.FILES.put(id, buf, { metadata: { type, updated } });
        const c = await getContent(env);
        const label = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' });
        c.data[id] = { url: `/${id}?v=${Date.now()}`, updated: label };
        await env.DB.prepare("UPDATE site_content SET data=?, updated_at=datetime('now'), updated_by='admin' WHERE id=1").bind(JSON.stringify(c.data)).run();
        return J({ ok: true, url: c.data[id].url, updated: label });
      }
    }
    return bad('Not found', 404);
  } catch (e) {
    return bad('Server error: ' + (e && e.message || e), 500);
  }
}
