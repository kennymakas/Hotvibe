# HotVibe D1 migrations

Apply production migrations with:

```powershell
npx wrangler d1 migrations apply hotvibe-db --remote
```

Keep media seed data separate from migrations. Upload files from `migration/uploads/` to R2 first, then run `migration/d1-seed.sql` manually.
