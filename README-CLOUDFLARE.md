# Cloudflare deployment

See `README.md` for the current Cloudflare-first setup.

HotVibe uses:

- Cloudflare Pages for the React/Vite site
- Pages Functions for `/api/*`
- Cloudflare D1 for application data
- Cloudflare R2 for media

There are no Supabase runtime calls in the application.
