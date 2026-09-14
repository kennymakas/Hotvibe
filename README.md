# HotVibe

## Run
PowerShell:
```powershell
npm install
npm run build
node server.cjs
```
Open http://localhost:3000

For development with Vite:
```powershell
npm run dev
```
Open http://localhost:5173. API requests are proxied to port 3000, so keep the backend running.

## Admin
Press Ctrl+Shift+O. Default demo password: `HotVibeAdmin`.
Change `JWT_SECRET` and `ADMIN_PASSWORD_HASH` before production.

Uploaded posts are stored in `data/posts.json` and media in `uploads/`.
