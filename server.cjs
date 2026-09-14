
const express = require("express");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const crypto = require("crypto");
const envFile = path.join(__dirname, ".env");
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1] in process.env) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "HotVibeAdmin";
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 12);

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.join(__dirname, "data");
const UPLOAD_DIR = process.env.UPLOAD_DIR ? path.resolve(process.env.UPLOAD_DIR) : path.join(__dirname, "uploads");
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const POSTS_FILE = path.join(DATA_DIR, "posts.json");
if (!fs.existsSync(POSTS_FILE)) fs.writeFileSync(POSTS_FILE, "[]");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = path.basename(file.originalname, ext).replace(/[^a-z0-9_-]/gi, "-").slice(0, 50);
    cb(null, `${Date.now()}-${safe || "media"}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const knownMedia = new Set([
      ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".svg", ".avif", ".tif", ".tiff",
      ".mp4", ".webm", ".mov", ".m4v", ".avi", ".mkv", ".3gp", ".mpeg", ".mpg", ".ogv",
      ".mp3", ".wav", ".ogg", ".oga", ".m4a", ".aac", ".flac", ".opus", ".wma", ".aiff", ".alac"
    ]);
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/") || file.mimetype.startsWith("audio/") || knownMedia.has(ext);
    cb(ok ? null : new Error("Unsupported media format. Choose an image, video, or audio file."), ok);
  }
});

function readPosts() {
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf8"));
}
function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Login required" });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}

app.get("/api/health", (_req, res) => res.json({ ok: true, service: "HotVibe" }));

app.get("/api/posts", (_req, res) => {
  res.json(readPosts());
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password || "");
  if (!bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    return res.status(401).json({ error: "Incorrect password" });
  }
  const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "8h" });
  res.json({ token });
});

app.post("/api/admin/posts", auth, upload.single("media"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Media file is required" });

  const ext = path.extname(req.file.originalname).toLowerCase();
  const type = req.file.mimetype.startsWith("video/") || [".mp4",".webm",".mov",".m4v",".avi",".mkv",".3gp",".mpeg",".mpg",".ogv"].includes(ext) ? "video" : req.file.mimetype.startsWith("audio/") || [".mp3",".wav",".ogg",".oga",".m4a",".aac",".flac",".opus",".wma",".aiff",".alac"].includes(ext) ? "audio" : "image";
  const post = {
    id: crypto.randomUUID(),
    type,
    mediaUrl: `/uploads/${req.file.filename}`,
    caption: String(req.body.caption || "").trim(),
    category: String(req.body.category || "Trending"),
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: 0,
    commentsEnabled: true
  };

  const posts = readPosts();
  posts.unshift(post);
  writePosts(posts);
  res.status(201).json(post);
});

app.patch("/api/admin/posts/:id/comments", auth, (req, res) => {
  const posts = readPosts();
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: "Post not found" });
  post.commentsEnabled = Boolean(req.body?.enabled);
  writePosts(posts);
  res.json(post);
});

app.delete("/api/admin/posts/:id", auth, (req, res) => {
  const posts = readPosts();
  const index = posts.findIndex(p => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Post not found" });

  const [removed] = posts.splice(index, 1);
  if (removed.mediaUrl) {
    const fileName = path.basename(removed.mediaUrl);
    const file = path.resolve(UPLOAD_DIR, fileName);
    const uploadRoot = path.resolve(UPLOAD_DIR);
    if (file === uploadRoot || file.startsWith(uploadRoot + path.sep)) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
  writePosts(posts);
  res.json({ ok: true });
});

const DIST_DIR = path.join(__dirname, "dist");
if (fs.existsSync(DIST_DIR)) app.use(express.static(DIST_DIR));
app.use((req, res, next) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/uploads/")) return next();
  const indexFile = path.join(DIST_DIR, "index.html");
  if (fs.existsSync(indexFile)) return res.sendFile(indexFile);
  res.status(503).send("HotVibe frontend has not been built. Run: npm run build");
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || "Upload failed" });
});

app.listen(PORT, HOST, () => {
  console.log(`HotVibe running on http://${HOST}:${PORT}`);
});
