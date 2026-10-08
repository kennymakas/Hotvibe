# HotVibe migration files

This folder contains the original two sample media files and the original post data.

For Cloudflare:
1. Upload the files under `uploads/` to the R2 bucket using the commands in `../README-CLOUDFLARE.md`.
2. Run `d1-seed.sql` against the D1 database.

`posts.json` is retained as a reference copy of the original data.
