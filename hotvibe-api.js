window.HotVibeAPI = {
  async login(password) {
    const r = await fetch("/api/admin/login", {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({password})});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Login failed");
    sessionStorage.setItem("hotvibe_admin_token", data.token);
    return data;
  },
  async posts() {
    const r = await fetch("/api/posts");
    if (!r.ok) throw new Error("Could not load posts");
    return r.json();
  },
  async publish(file, caption, category) {
    const token = sessionStorage.getItem("hotvibe_admin_token");
    const form = new FormData();
    form.append("media", file); form.append("caption", caption); form.append("category", category);
    const r = await fetch("/api/admin/posts", {method:"POST",headers:{Authorization:`Bearer ${token}`},body:form});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Publish failed");
    return data;
  },
  async deletePost(id) {
    const token = sessionStorage.getItem("hotvibe_admin_token");
    const r = await fetch(`/api/admin/posts/${id}`, {method:"DELETE",headers:{Authorization:`Bearer ${token}`}});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Could not delete post");
    return data;
  },
  async toggleComments(id, enabled) {
    const token = sessionStorage.getItem("hotvibe_admin_token");
    const r = await fetch(`/api/admin/posts/${id}/comments`, {method:"PATCH",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({enabled})});
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Could not change comment setting");
    return data;
  },
  logout(){sessionStorage.removeItem("hotvibe_admin_token");}
};