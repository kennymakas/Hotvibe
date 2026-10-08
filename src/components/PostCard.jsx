import { Bookmark, Flame, Heart, MessageCircle, MoreHorizontal, Share2, Eye } from "lucide-react";
import { useEffect, useRef } from "react";

export default function PostCard({ post, liked, saved, onLike, onSave, onComment, onView }) {
  const viewRef = useRef(false);
  useEffect(() => {
    if (viewRef.current || !onView) return;
    viewRef.current = true;
    onView(post.id);
  }, [post.id, onView]);
  const formatNumber = (number) => {
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return number;
  };

  const makeSlug = (text) =>
    String(text || "post").trim().toLowerCase()
      .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "post";

  const share = async () => {
    // Each post gets its own readable URL containing its caption.
    const caption = (post.caption || post.title || "").trim();
    const postSlug = makeSlug(caption);
    const shareUrl = `${window.location.origin}/post/${encodeURIComponent(String(post.id))}/${postSlug}`;

    const shareText = caption
      ? `${caption}\n\nShared from HotVibe`
      : "Shared from HotVibe";

    const data = {
      title: "HotVibe",
      text: shareText,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        // On supported phones/apps this sends the caption together
        // with the HotVibe link through the system share sheet.
        await navigator.share(data);
      } else {
        // Desktop/browser fallback: copy both caption and link.
        const textToCopy = `${shareText}\n${shareUrl}`;
        await navigator.clipboard.writeText(textToCopy);
        alert("Caption and page link copied!");
      }
    } catch {
      // User cancelled sharing.
    }
  };

  return (
    <article id={`post-${post.id}`} className="post-card">
      <div className="post-header">
        <div className="post-publisher">
          <span className="publisher-label">HotVibe · Official post{post.createdAt ? ` · ${new Date(post.createdAt).toLocaleDateString()}` : ""}</span>
        </div>
        <button className="icon-button" aria-label="More options">
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="post-media" onContextMenu={(e) => e.preventDefault()} onDragStart={(e) => e.preventDefault()}>
        {post.video ? (
          <video src={post.video} controls playsInline preload="metadata" controlsList="nodownload noremoteplayback" disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="post-image" />
        ) : post.audio ? (
          <div className="post-audio"><audio src={post.audio} controls preload="metadata" controlsList="nodownload noremoteplayback" onContextMenu={(e) => e.preventDefault()} /></div>
        ) : (
          <img src={post.image} alt={post.title} draggable="false" onContextMenu={(e) => e.preventDefault()} className="post-image" />
        )}

        {post.category === "Trending" && (
          <div className="hot-badge">
            <Flame size={14} /> Hot
          </div>
        )}
      </div>

      <div className="post-content">
        <p>{post.title}</p>
      </div>

      <div className="post-tags">
        {post.tags?.map((tag) => <span key={tag}>{tag}</span>)}
      </div>

      <div className="post-stats">
        <span className="stat-badge like-badge"><Heart size={14} fill={liked ? "currentColor" : "none"} /> {formatNumber(post.likes || 0)}</span>
        <span className="stat-badge comment-badge"><MessageCircle size={14} /> {formatNumber(post.commentsCount ?? post.comments?.length ?? 0)}</span>
        <span className="views-stat"><Eye size={14} /> {formatNumber(post.views || 0)} views</span>
      </div>

      <div className="post-actions">
        <button className={`post-action ${liked ? "liked" : ""}`} onClick={() => onLike(post.id)}>
          <Heart size={19} fill={liked ? "currentColor" : "none"} />
          <span>Like</span>
        </button>

        {post.commentsEnabled && (
          <button className="post-action" onClick={() => onComment(post)}>
            <MessageCircle size={19} />
            <span>Comment</span>
          </button>
        )}

        <button className="post-action" onClick={share}>
          <Share2 size={19} />
          <span>Share</span>
        </button>

        <button className={`post-action ${saved ? "saved" : ""}`} onClick={() => onSave(post.id)}>
          <Bookmark size={19} fill={saved ? "currentColor" : "none"} />
          <span>Save</span>
        </button>
      </div>
    </article>
  );
}
