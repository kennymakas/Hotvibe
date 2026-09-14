# HotVibe remote deployment

## Admin access
The admin area is no longer exposed on the public feed. Open:

`https://YOUR-DOMAIN/admin`

Sign in with `ADMIN_PASSWORD`. After logout, the admin panel closes and the browser returns to `/`.

## Local development
```powershell
npm install
npm run build
npm start
```

Then open `http://localhost:3000` for the public feed or `http://localhost:3000/admin` for administration.

## Remote deployment
This project includes `render.yaml` for a Render web service with a persistent disk. The persistent disk is used for `data/posts.json` and uploaded media so posts survive server restarts/redeploys.

Set these environment variables in the hosting dashboard:
- `ADMIN_PASSWORD` = your private admin password
- `JWT_SECRET` = a long random secret
- `DATA_DIR` = `/var/data`
- `UPLOAD_DIR` = `/var/data/uploads`

Do not commit your real `.env` file or secrets to a public repository.

### Important
The current backend stores uploads on disk. A persistent disk is therefore required on hosts whose normal filesystem is ephemeral. For multiple servers or large-scale traffic, move media to object storage (for example S3-compatible storage) and move post data to a managed database.
