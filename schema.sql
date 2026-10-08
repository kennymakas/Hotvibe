-- HotVibe Cloudflare D1 schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('image','video','audio')),
  media_url TEXT NOT NULL,
  media_path TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Trending',
  created_at TEXT NOT NULL,
  likes INTEGER NOT NULL DEFAULT 0,
  comments INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0,
  views INTEGER NOT NULL DEFAULT 0,
  comments_enabled INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts(created_at DESC);

CREATE TABLE IF NOT EXISTS hotvibe_likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY(post_id, visitor_id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  user_name TEXT NOT NULL DEFAULT 'Guest',
  text TEXT NOT NULL CHECK (length(trim(text)) BETWEEN 1 AND 1000),
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id, created_at);

CREATE TABLE IF NOT EXISTS hotvibe_visits (
  visitor_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  visit_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS hotvibe_view_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  viewed_at TEXT NOT NULL,
  UNIQUE(post_id, visitor_id)
);
CREATE INDEX IF NOT EXISTS hotvibe_views_post_idx ON hotvibe_view_events(post_id);

-- Optional seed for the two media items included in the original project.
-- The media files must first be uploaded to R2 under migration/uploads/.
