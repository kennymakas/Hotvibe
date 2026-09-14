# HotVibe password setup

1. Open the `.env` file in the project root.
2. Set `ADMIN_PASSWORD` to your private admin password.
3. Set `JWT_SECRET` to a long random secret.
4. Save the file.
5. Run `npm install` and then `npm run build` / `npm run dev`.

Do not share or commit `.env`.

The admin upload panel supports images, videos, and audio files. Upload limit is 500 MB per file. Comments can be switched ON/OFF per post from the authenticated admin panel and the setting is stored in `data/posts.json`.
