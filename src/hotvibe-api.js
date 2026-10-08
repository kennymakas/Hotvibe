const VISITOR_KEY = "hotvibe_visitor_id";

function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return crypto.randomUUID(); }
}

async function request(path, options = {}, fallback = "Request failed") {
  let r;
  try {
    r = await fetch(`/api/${path.replace(/^\/+/, "")}`, {
      credentials: "same-origin",
      ...options,
      headers: { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) },
    });
  } catch (err) {
    throw new Error(`Could not connect to the HotVibe Cloudflare API. ${err?.message || "Network request failed"}`);
  }
  if (!r.ok) {
    let data = null; try { data = await r.json(); } catch {}
    throw new Error(data?.error || data?.message || fallback);
  }
  if (r.status === 204) return null;
  const text = await r.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

const HotVibeAPI = {
  async login(password, email) {
    const result = await request("login", { method:"POST", body: JSON.stringify({ email, password }) }, "Incorrect email or password");
    return result;
  },
  async isAuthenticated() {
    try { return Boolean((await request("me", {}, "Could not check admin session")).authenticated); }
    catch { return false; }
  },
  isAuthenticatedSync() {
    return false;
  },
  async posts() {
    return request("posts", {}, "Could not load posts");
  },
  async publish(file, caption, category) {
    if (!file) throw new Error("Media file is required");
    if (file.size > 50 * 1024 * 1024) throw new Error("Media files are limited to 50 MB.");
    const form = new FormData();
    form.append("file", file);
    form.append("caption", caption.trim());
    form.append("category", category || "Trending");
    return request("publish", { method:"POST", body:form }, "Could not publish the post");
  },
  async deletePost(id) {
    return request(`posts/${encodeURIComponent(id)}`, { method:"DELETE" }, "Could not delete the post");
  },
  async toggleComments(id, enabled) {
    return request(`posts/${encodeURIComponent(id)}/comments-toggle`, { method:"POST", body:JSON.stringify({ enabled }) }, "Could not change comment setting");
  },
  async likedPosts() {
    return request("liked-posts", { method:"POST", body:JSON.stringify({ visitor_id:getVisitorId() }) }, "Could not load your likes");
  },
  async toggleLike(postId) {
    return request(`posts/${encodeURIComponent(postId)}/like`, { method:"POST", body:JSON.stringify({ visitor_id:getVisitorId() }) }, "Could not save your like");
  },
  async addComment(postId, text) {
    return request(`posts/${encodeURIComponent(postId)}/comments`, { method:"POST", body:JSON.stringify({ visitor_id:getVisitorId(), text }) }, "Could not save your comment");
  },
  async comments(postId) {
    return request(`posts/${encodeURIComponent(postId)}/comments`, {}, "Could not load comments");
  },
  async recordView(postId) {
    return request(`posts/${encodeURIComponent(postId)}/view`, { method:"POST", body:JSON.stringify({ visitor_id:getVisitorId() }) }, "Could not record view");
  },
  async recordVisit() {
    return request("record-visit", { method:"POST", body:JSON.stringify({ visitor_id:getVisitorId() }) }, "Could not record visit");
  },
  async analytics() {
    return request("analytics", {}, "Could not load analytics");
  },
  async logout() {
    return request("logout", { method:"POST" }, "Could not log out");
  },
};

export default HotVibeAPI;
