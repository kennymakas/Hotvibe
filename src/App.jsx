import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import TrendingSidebar from "./components/TrendingSidebar";
import AdSense from "./components/AdSense";
import CommentsModal from "./components/CommentsModal";
import AdminCommentsPanel from "./components/AdminCommentsPanel";
import AdminUploadPanel from "./components/AdminUploadPanel";
import AdminLogin from "./components/AdminLogin";
import Home from "./pages/Home";
import { initialPosts } from "./data/posts";
import HotVibeAPI from "./hotvibe-api";


export default function App() {
  const [posts, setPosts] = useState(initialPosts);
  const [category, setCategory] = useState("Trending");
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState([]);
  const [saved, setSaved] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [commentPost, setCommentPost] = useState(null);
  const [targetPostId, setTargetPostId] = useState(() => {
    const match = window.location.pathname.match(/^\/post\/([^/]+)(?:\/.*)?$/);
    return match ? decodeURIComponent(match[1]) : null;
  });
  const isAdminPath = window.location.pathname.replace(/\/+$/, "") === "/admin";
  const [adminOpen, setAdminOpen] = useState(isAdminPath);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);

  useEffect(() => {
    HotVibeAPI.isAuthenticated().then(setAdminAuthenticated).catch(() => setAdminAuthenticated(false));
  }, []);

  useEffect(() => {
    // A shared /post/:id/:caption URL opens the exact post and keeps the caption in the link.
    if (targetPostId) {
      setCategory("Trending");
      setSearch("");
    }
  }, [targetPostId]);

  useEffect(() => {
    HotVibeAPI.posts().then((serverPosts) => {
      const normalized = (Array.isArray(serverPosts) ? serverPosts : []).map((p) => ({
        ...p,
        title: p.caption || p.title || "Untitled post",
        image: p.type === "image" ? p.mediaUrl : undefined,
        video: p.type === "video" ? p.mediaUrl : undefined,
        audio: p.type === "audio" ? p.mediaUrl : undefined,
        tags: [`#${p.category}`],
        comments: [],
        views: p.views || 0,
        commentsEnabled: p.commentsEnabled !== false
      }));
      setPosts((current) => [...normalized, ...current.filter((p) => !normalized.some((s) => s.id === p.id))]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    HotVibeAPI.recordVisit().catch(() => {});
  }, []);

  useEffect(() => {
    HotVibeAPI.likedPosts().then(setLiked).catch(() => {});
  }, []);

  useEffect(() => {
    if (!adminAuthenticated) return;
    HotVibeAPI.analytics().then(setAnalytics).catch(() => {});
  }, [adminAuthenticated]);

  const recordPostView = async (id) => {
    try {
      const result = await HotVibeAPI.recordView(id);
      const views = Number(result?.views || result?.record_hotvibe_view || 0);
      if (views) setPosts(current => current.map(p => p.id === id ? { ...p, views } : p));
    } catch {}
  };

  const openComments = async (post) => {
    try {
      const comments = await HotVibeAPI.comments(post.id);
      setCommentPost({ ...post, comments });
    } catch {
      setCommentPost({ ...post, comments: [] });
    }
  };

  const addPost = (post) => setPosts((current) => [post, ...current]);

  const deletePost = async (post) => {
    const label = post?.title ? `\n\n"${post.title}"` : "";
    if (!window.confirm(`Delete this post permanently?${label}\n\nThis also deletes its uploaded media.`)) return;
    try {
      await HotVibeAPI.deletePost(post.id);
      setPosts((current) => current.filter((item) => item.id !== post.id));
      setCommentPost((current) => current?.id === post.id ? null : current);
    } catch (err) {
      alert(err.message || "Could not delete the post.");
    }
  };


  const toggleLike = async (id) => {
    try {
      const result = await HotVibeAPI.toggleLike(id);
      const likedNow = Boolean(result?.liked);
      const likes = Number(result?.likes || 0);
      setLiked(current => likedNow ? (current.includes(id) ? current : [...current, id]) : current.filter(item => item !== id));
      setPosts(current => current.map(post => post.id === id ? { ...post, likes } : post));
    } catch (err) {
      alert(err.message || "Could not save your like.");
    }
  };

  const toggleSave = (id) => {
    setSaved((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const addComment = async (id, text) => {
    try {
      const savedComment = await HotVibeAPI.addComment(id, text);
      const newComment = { id: savedComment.id, user: savedComment.user_name || "Guest", text: savedComment.text, createdAt: savedComment.created_at };
      setPosts(current => current.map(post => post.id === id ? { ...post, comments: [...(post.comments || []), newComment], commentsCount: Number(savedComment.comments_count || ((post.comments || []).length + 1)) } : post));
      setCommentPost(current => current?.id === id ? { ...current, comments: [...(current.comments || []), newComment] } : current);
    } catch (err) {
      alert(err.message || "Could not save your comment.");
    }
  };

  const toggleComments = async (id) => {
    const current = posts.find((post) => post.id === id);
    if (!current) return;
    const enabled = !current.commentsEnabled;
    try {
      const saved = await HotVibeAPI.toggleComments(id, enabled);
      setPosts((items) => items.map((post) => post.id === id ? { ...post, commentsEnabled: saved.commentsEnabled } : post));
      setCommentPost((open) => open?.id === id ? { ...open, commentsEnabled: saved.commentsEnabled } : open);
    } catch (err) {
      alert(err.message || "Could not change comment setting.");
    }
  };

  return (
    <>
      <Navbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} />

      <div className="mobile-top-ad">
        <AdSense />
      </div>

      <div className="app-layout">
        <Home
          posts={posts}
          category={category}
          setCategory={setCategory}
          search={search}
          liked={liked}
          saved={saved}
          onLike={toggleLike}
          onSave={toggleSave}
          onComment={openComments}
          onView={recordPostView}
          targetPostId={targetPostId}
        />

        <aside className="right-rail">
          <AdSense className="desktop-side-ad" />
          <TrendingSidebar setSearch={setSearch} />
        </aside>
      </div>

      {adminOpen && (
        <div className="admin-area">
          {adminAuthenticated ? (
            <>
              <div className="admin-toolbar">
                <span>🔐 Admin mode</span>
                <button type="button" onClick={() => {
                HotVibeAPI.logout();
                setAdminAuthenticated(false);
                setAdminOpen(false);
                window.history.replaceState({}, "", "/");
              }}>Log out</button>
              </div>
              {analytics && <section className="analytics-panel"><div className="analytics-title"><strong>HotVibe Analytics</strong><button type="button" onClick={() => HotVibeAPI.analytics().then(setAnalytics).catch(() => {})}>Refresh</button></div><div className="analytics-grid"><div><b>{analytics.total_visits || 0}</b><span>Visits</span></div><div><b>{analytics.total_views || 0}</b><span>Post views</span></div><div><b>{analytics.total_likes || 0}</b><span>Likes</span></div><div><b>{analytics.total_comments || 0}</b><span>Comments</span></div></div></section>}
              <AdminUploadPanel onPublish={addPost} />
              <AdminCommentsPanel posts={posts} onToggle={toggleComments} onDelete={deletePost} />
            </>
          ) : (
            <AdminLogin onSuccess={() => setAdminAuthenticated(true)} />
          )}
        </div>
      )}


      {commentPost?.commentsEnabled && (
        <CommentsModal
          post={commentPost}
          onClose={() => setCommentPost(null)}
          onAddComment={addComment}
        />
      )}
      <footer className="site-footer">
        <div className="footer-inner">
          <div><strong>Contact HotVibe</strong><p>For enquiries, partnerships or support, reach us on X:</p></div>
          <div className="footer-handles">
            <a href="https://x.com/Ug35198223Ug" target="_blank" rel="noreferrer">@Ug35198223Ug</a>
            <a href="https://x.com/kamakama" target="_blank" rel="noreferrer">@kamakama</a>
          </div>
        </div>
      </footer>
    </>
  );
}
