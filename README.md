# HotVibe — Cloudflare-hosted React + D1 + R2

HotVibe is structured to run on Cloudflare as the hosting platform:

- **Cloudflare Pages** — React/Vite frontend
- **Pages Functions** — `/api/*` backend endpoints
- **Cloudflare D1** — posts, comments, likes, views and visit analytics
- **Cloudflare R2** — uploaded images, videos and audio
- **HttpOnly signed cookie** — admin session

No Supabase runtime dependency is required.

## 1. Install and authenticate

From this folder:

```powershell
npm install
npx wrangler login
npx wrangler whoami
```

## 2. Create Cloudflare resources

```powershell
npx wrangler d1 create hotvibe-db
npx wrangler r2 bucket create hotvibe-media
```

Copy the D1 `database_id` into `wrangler.toml`:

```toml
database_id = "YOUR_REAL_DATABASE_ID"
```

## 3. Create the D1 schema

The schema is stored in `migrations/0001_initial.sql`.

```powershell
npx wrangler d1 migrations apply hotvibe-db --remote
```

Verify:

```powershell
npx wrangler d1 execute hotvibe-db --remote --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

## 4. Configure admin secrets

Use a real admin email, a strong password, and a long random session secret.

```powershell
npx wrangler pages secret put ADMIN_EMAIL --project-name hotvibe
npx wrangler pages secret put ADMIN_PASSWORD --project-name hotvibe
npx wrangler pages secret put ADMIN_SESSION_SECRET --project-name hotvibe
```

For local development, copy `.dev.vars.example` to `.dev.vars` and fill in the values.

## 5. Migrate the included media

The project contains two sample media files in `migration/uploads/`.

Upload them to R2:

```powershell
npx wrangler r2 object put hotvibe-media/migration/uploads/1789338411150-_MCA7766.jpg --file="./migration/uploads/1789338411150-_MCA7766.jpg"
npx wrangler r2 object put hotvibe-media/migration/uploads/1789338476544-Believer-Laika-Official-Video_720p.mp4 --file="./migration/uploads/1789338476544-Believer-Laika-Official-Video_720p.mp4"
```

Then seed their D1 records:

```powershell
npx wrangler d1 execute hotvibe-db --remote --file="./migration/d1-seed.sql"
```

## 6. Deploy to Cloudflare Pages

Build:

```powershell
npm run build
```

Deploy:

```powershell
npx wrangler pages deploy dist --project-name hotvibe
```

The `functions/api/[[path]].js` function is deployed with the Pages project and handles `/api/*`.

## 7. Cloudflare Dashboard bindings

If you manage the Pages project from the dashboard, confirm these Production bindings:

- D1 binding: `DB` → `hotvibe-db`
- R2 binding: `MEDIA` → `hotvibe-media`

And these Production secrets:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET`

Redeploy after changing bindings or secrets.

## 8. Local Cloudflare development

Create `.dev.vars` from `.dev.vars.example`, then:

```powershell
npm run cf:dev
```

## 9. Admin

Open `/admin` on the deployed site and use the Cloudflare-configured admin email/password.

## 10. Architecture

```text
Browser
  │
  ▼
Cloudflare Pages (React)
  │
  ▼
Pages Functions /api/*
  ├── D1: posts/comments/likes/views/analytics
  └── R2: images/videos/audio
```

The browser never receives D1 or R2 credentials. Media is served through the API, so the R2 bucket can remain private.

## 11. Upload size

The current HotVibe admin UI limits individual uploads to 50 MB. Larger videos can later be supported with direct R2 multipart uploads.
