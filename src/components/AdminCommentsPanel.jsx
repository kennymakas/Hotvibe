import { LockKeyhole, MessageCircle, Power, Trash2 } from "lucide-react";

export default function AdminCommentsPanel({ posts, onToggle, onDelete }) {
  return (
    <section className="admin-panel">
      <div className="admin-heading">
        <div>
          <h2><LockKeyhole size={18} /> Comment controls</h2>
          <p>Turn comments on or off for each published post. Changes are saved to the backend.</p>
        </div>
      </div>

      <div className="admin-posts">
        {posts.map((post) => (
          <div className="admin-row" key={post.id}>
            <div>
              <strong>{post.title}</strong>
              <small>{post.category || "Post"}</small>
            </div>
            <div className="admin-row-actions">
              <button
                type="button"
                className={`toggle-button ${post.commentsEnabled ? "on" : "off"}`}
                onClick={() => onToggle(post.id)}
              >
                <Power size={16} />
                {post.commentsEnabled ? "Comments ON" : "Comments OFF"}
              </button>
              <button
                type="button"
                className="delete-button"
                onClick={() => onDelete(post)}
                aria-label={`Delete ${post.title || "post"}`}
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-warning">
        <MessageCircle size={16} />
        Delete removes the post and its uploaded media from the backend. These controls are admin-only.
      </div>
    </section>
  );
}
