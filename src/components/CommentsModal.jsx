import { Send, X } from "lucide-react";
import { useState } from "react";

export default function CommentsModal({ post, onClose, onAddComment }) {
  const [text, setText] = useState("");

  if (!post) return null;

  const submit = () => {
    const value = text.trim();
    if (!value) return;
    onAddComment(post.id, value);
    setText("");
  };

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="comments-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Comments</h2>
            <p>{post.title}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close comments">
            <X size={20} />
          </button>
        </div>

        <div className="comments-list">
          {post.comments?.length ? (
            post.comments.map((comment) => (
              <div className="comment" key={comment.id}>
                <div className="comment-avatar">
                  {comment.user.slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <strong>{comment.user}</strong>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-comments">No comments yet.</div>
          )}
        </div>

        <div className="comment-input">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Write a comment..."
          />
          <button className="send-button" onClick={submit} aria-label="Send comment">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
