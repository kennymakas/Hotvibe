const COOKIE_NAME = "hotvibe_admin";
const SESSION_TTL = 7 * 24 * 60 * 60;

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

const normalize = (r) => ({
  id: r.id,
  type: r.type,
  mediaUrl: r.media_url,
  caption: r.caption || "",
  category: r.category || "Trending",
  createdAt: r.created_at,
  likes: Number(r.likes || 0),
  comments: Number(r.comments_count ?? r.comments ?? 0),
  commentsCount: Number(r.comments_count ?? r.comments ?? 0),
  views: Number(r.views || 0),
  commentsEnabled: r.comments_enabled !== 0,
});

function visitorId(request, body) {
  return String(body?.visitor_id || request.headers.get("x-hotvibe-visitor") || "").trim().slice(0, 200);
}

function b64url(bytes) {
  let s = "";
  const arr = bytes instanceof Uint8Array ? bytes : new TextEncoder().encode(bytes);
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const raw = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))));
}
async function makeSession(secret) {
  const payload = b64url(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL }));
  return `${payload}.${await sign(payload, secret)}`;
}
async function validSession(request, secret) {
  if (!secret) return false;
  const raw = request.headers.get("Cookie") || "";
  const token = raw.split(";").map(x => x.trim()).find(x => x.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1);
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = await sign(payload, secret);
  if (sig.length !== expected.length) return false;
  const a = new TextEncoder().encode(sig), b = new TextEncoder().encode(expected);
  let diff = 0; for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  if (diff !== 0) return false;
  try { return JSON.parse(new TextDecoder().decode(fromB64url(payload))).exp > Math.floor(Date.now() / 1000); }
  catch { return false; }
}
function adminCookie(token) {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL}`;
}
function clearCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
function requireVisitor(request, body) {
  const id = visitorId(request, body);
  if (!id) throw new Error("Visitor ID is required");
  return id;
}
function safeName(name) {
  const base = String(name || "media").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9_-]/gi, "-").slice(0, 50) || "media";
  const ext = (String(name || "").split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  return `${crypto.randomUUID()}-${base}.${ext}`;
}
function mediaType(file) {
  const type = file.type || "";
  const ext = String(file.name || "").toLowerCase().split(".").pop();
  const videos = new Set(["mp4","webm","mov","m4v","avi","mkv","3gp","mpeg","mpg","ogv"]);
  const audios = new Set(["mp3","wav","ogg","oga","m4a","aac","flac","opus","wma","aiff","alac"]);
  return type.startsWith("video/") || videos.has(ext) ? "video" : type.startsWith("audio/") || audios.has(ext) ? "audio" : "image";
}
function mediaUrl(path) {
  return `/api/media/${path.split("/").map(encodeURIComponent).join("/")}`;
}

async function handle(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  const method = request.method.toUpperCase();

  if (!env.DB || !env.MEDIA) return json({ error: "Cloudflare D1/R2 bindings are not configured." }, 500);

  if (path.startsWith("media/") && (method === "GET" || method === "HEAD")) {
    const key = decodeURIComponent(path.slice(6));
    const rangeHeader = request.headers.get("Range");
    let range;
    if (rangeHeader?.startsWith("bytes=")) {
      const [startRaw, endRaw] = rangeHeader.slice(6).split("-");
      const start = Number(startRaw);
      const end = endRaw ? Number(endRaw) : undefined;
      if (Number.isFinite(start)) range = end !== undefined ? { offset: start, length: end - start + 1 } : { offset: start };
    }
    const object = await env.MEDIA.get(key, range ? { range } : undefined);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    if (object.range) {
      const size = object.size;
      const offset = object.range.offset;
      const length = object.range.length;
      headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${size}`);
      headers.set("Content-Length", String(length));
      return new Response(method === "HEAD" ? null : object.body, { status: 206, headers });
    }
    headers.set("Content-Length", String(object.size));
    return new Response(method === "HEAD" ? null : object.body, { status: 200, headers });
  }

  if (path === "login" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) return json({ error: "Cloudflare admin secrets are not configured." }, 500);
    if (String(body.email || "").trim().toLowerCase() !== env.ADMIN_EMAIL.toLowerCase() || String(body.password || "") !== env.ADMIN_PASSWORD) {
      return json({ error: "Incorrect email or password" }, 401);
    }
    const token = await makeSession(env.ADMIN_SESSION_SECRET);
    return json({ ok: true }, 200, { "Set-Cookie": adminCookie(token) });
  }

  if (path === "logout" && method === "POST") return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
  if (path === "me" && method === "GET") return json({ authenticated: await validSession(request, env.ADMIN_SESSION_SECRET) });

  if (path === "posts" && method === "GET") {
    const { results } = await env.DB.prepare("SELECT * FROM posts ORDER BY datetime(created_at) DESC").all();
    return json(results.map(normalize));
  }

  if (path === "liked-posts" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const visitor = requireVisitor(request, body);
    const { results } = await env.DB.prepare("SELECT post_id FROM hotvibe_likes WHERE visitor_id=?").bind(visitor).all();
    return json(results.map(r => r.post_id));
  }

  if (path === "publish" && method === "POST") {
    if (!(await validSession(request, env.ADMIN_SESSION_SECRET))) return json({ error: "Login required" }, 401);
    const form = await request.formData();
    const file = form.get("file");
    const caption = String(form.get("caption") || "").trim();
    const category = String(form.get("category") || "Trending");
    if (!(file instanceof File)) return json({ error: "Media file is required" }, 400);
    if (file.size > 50 * 1024 * 1024) return json({ error: "Media files are limited to 50 MB." }, 400);
    const key = safeName(file.name);
    const type = mediaType(file);
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await env.DB.prepare(`INSERT INTO posts (id,type,media_url,media_path,caption,category,created_at,likes,comments,comments_count,views,comments_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?,1)`)
        .bind(id, type, mediaUrl(key), key, caption, category, createdAt, 0, 0, 0, 0).run();
    } catch (e) {
      await env.MEDIA.delete(key).catch(() => {});
      throw e;
    }
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
    return json(normalize(row), 201);
  }

  const toggleLike = path.match(/^posts\/([^/]+)\/like$/);
  if (toggleLike && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const visitor = requireVisitor(request, body);
    const id = decodeURIComponent(toggleLike[1]);
    const existing = await env.DB.prepare("SELECT 1 FROM hotvibe_likes WHERE post_id=? AND visitor_id=?").bind(id, visitor).first();
    if (existing) await env.DB.prepare("DELETE FROM hotvibe_likes WHERE post_id=? AND visitor_id=?").bind(id, visitor).run();
    else await env.DB.prepare("INSERT OR IGNORE INTO hotvibe_likes(post_id,visitor_id) VALUES (?,?)").bind(id, visitor).run();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM hotvibe_likes WHERE post_id=?").bind(id).first();
    const liked = !existing;
    await env.DB.prepare("UPDATE posts SET likes=? WHERE id=?").bind(Number(count.count), id).run();
    return json({ liked, likes: Number(count.count) });
  }

  const commentRoute = path.match(/^posts\/([^/]+)\/comments$/);
  if (commentRoute && method === "GET") {
    const id = decodeURIComponent(commentRoute[1]);
    const { results } = await env.DB.prepare("SELECT id,user_name,text,created_at FROM comments WHERE post_id=? ORDER BY datetime(created_at) ASC").bind(id).all();
    return json(results.map(c => ({ id:c.id, user:c.user_name || "Guest", text:c.text, createdAt:c.created_at })));
  }
  if (commentRoute && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const visitor = requireVisitor(request, body);
    const id = decodeURIComponent(commentRoute[1]);
    const text = String(body.text || "").trim();
    if (!text || text.length > 1000) return json({ error: "Comment must be between 1 and 1000 characters." }, 400);
    const post = await env.DB.prepare("SELECT comments_enabled FROM posts WHERE id=?").bind(id).first();
    if (!post) return json({ error: "Post not found" }, 404);
    if (!post.comments_enabled) return json({ error: "Comments are disabled for this post" }, 403);
    const cid = crypto.randomUUID(), now = new Date().toISOString();
    await env.DB.prepare("INSERT INTO comments(id,post_id,visitor_id,user_name,text,created_at) VALUES (?,?,?,?,?,?)").bind(cid,id,visitor,"Guest",text,now).run();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM comments WHERE post_id=?").bind(id).first();
    await env.DB.prepare("UPDATE posts SET comments_count=?, comments=? WHERE id=?").bind(Number(count.count),Number(count.count),id).run();
    return json({ id:cid, user_name:"Guest", text, created_at:now, comments_count:Number(count.count) }, 201);
  }

  if (path === "record-visit" && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const visitor = requireVisitor(request, body);
    const now = new Date().toISOString();
    await env.DB.prepare(`INSERT INTO hotvibe_visits(visitor_id,first_seen_at,last_seen_at,visit_count) VALUES (?,?,?,1)
      ON CONFLICT(visitor_id) DO UPDATE SET last_seen_at=excluded.last_seen_at, visit_count=hotvibe_visits.visit_count+1`).bind(visitor,now,now).run();
    return json({ ok:true });
  }

  const viewRoute = path.match(/^posts\/([^/]+)\/view$/);
  if (viewRoute && method === "POST") {
    const body = await request.json().catch(() => ({}));
    const visitor = requireVisitor(request, body);
    const id = decodeURIComponent(viewRoute[1]);
    await env.DB.prepare("INSERT OR IGNORE INTO hotvibe_view_events(post_id,visitor_id,viewed_at) VALUES (?,?,?)").bind(id,visitor,new Date().toISOString()).run();
    const count = await env.DB.prepare("SELECT COUNT(*) AS count FROM hotvibe_view_events WHERE post_id=?").bind(id).first();
    await env.DB.prepare("UPDATE posts SET views=? WHERE id=?").bind(Number(count.count),id).run();
    return json({ views:Number(count.count) });
  }

  if (path === "analytics" && method === "GET") {
    if (!(await validSession(request, env.ADMIN_SESSION_SECRET))) return json({ error: "Admin login required" }, 401);
    const [v,l,c] = await Promise.all([
      env.DB.prepare("SELECT COALESCE(SUM(visit_count),0) AS total FROM hotvibe_visits").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM hotvibe_likes").first(),
      env.DB.prepare("SELECT COUNT(*) AS total FROM comments").first(),
    ]);
    const views = await env.DB.prepare("SELECT COUNT(*) AS total FROM hotvibe_view_events").first();
    return json({ total_visits:Number(v.total), unique_visitors:Number((await env.DB.prepare("SELECT COUNT(*) AS total FROM hotvibe_visits").first()).total), total_likes:Number(l.total), total_comments:Number(c.total), total_views:Number(views.total) });
  }

  const toggleComments = path.match(/^posts\/([^/]+)\/comments-toggle$/);
  if (toggleComments && method === "POST") {
    if (!(await validSession(request, env.ADMIN_SESSION_SECRET))) return json({ error: "Login required" }, 401);
    const body = await request.json().catch(() => ({}));
    const id = decodeURIComponent(toggleComments[1]);
    const enabled = Boolean(body.enabled);
    await env.DB.prepare("UPDATE posts SET comments_enabled=? WHERE id=?").bind(enabled ? 1 : 0,id).run();
    const row = await env.DB.prepare("SELECT * FROM posts WHERE id=?").bind(id).first();
    return json(normalize(row));
  }

  const deleteRoute = path.match(/^posts\/([^/]+)$/);
  if (deleteRoute && method === "DELETE") {
    if (!(await validSession(request, env.ADMIN_SESSION_SECRET))) return json({ error: "Login required" }, 401);
    const id = decodeURIComponent(deleteRoute[1]);
    const row = await env.DB.prepare("SELECT media_path FROM posts WHERE id=?").bind(id).first();
    if (!row) return json({ error: "Post not found" }, 404);
    await env.DB.prepare("DELETE FROM posts WHERE id=?").bind(id).run();
    if (row.media_path) await env.MEDIA.delete(row.media_path).catch(() => {});
    return json({ ok:true });
  }

  return json({ error: "Not found" }, 404);
}

export async function onRequest(context) {
  try { return await handle(context); }
  catch (error) { console.error(error); return json({ error: error?.message || "Request failed" }, 500); }
}
