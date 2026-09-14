# HotVibe backend

## What this adds
- Password-protected admin login
- Real image/video uploads
- Persistent posts stored in `data/posts.json`
- Uploaded media stored in `uploads/`
- JWT admin sessions
- Public `/api/posts` feed endpoint
- Admin delete endpoint

## Run locally
1. Install Node.js 18+.
2. Run `npm install`.
3. Set `JWT_SECRET` and `ADMIN_PASSWORD_HASH`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

For a quick demo, if no environment variables are supplied, the admin password defaults to `HotVibeAdmin`. **Change this before deployment.**

## Frontend integration
The admin form should:
- POST password to `/api/admin/login`
- Store the returned token for the session
- POST `multipart/form-data` to `/api/admin/posts` with fields `media`, `caption`, and `category`
- GET `/api/posts` to render the feed
- Send `Authorization: Bearer <token>` for admin requests

For production, use HTTPS, a strong secret/password hash, and object storage/database rather than local JSON/files if you expect substantial traffic.
