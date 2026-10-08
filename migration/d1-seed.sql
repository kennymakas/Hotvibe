-- Run after creating the D1 database and uploading the two files to R2.
INSERT OR REPLACE INTO posts
(id,type,media_url,media_path,caption,category,created_at,likes,comments,comments_count,views,comments_enabled)
VALUES
('503d065d-c584-4e4b-8d23-63c07f5d1199','video',
 '/api/media/migration/uploads/1789338476544-Believer-Laika-Official-Video_720p.mp4',
 'migration/uploads/1789338476544-Believer-Laika-Official-Video_720p.mp4',
 'likia sing','Trending','2026-09-13T22:27:56.746Z',0,0,0,0,1),
('3eae77b7-3cc6-4546-b2db-b1ee1cf2c98f','image',
 '/api/media/migration/uploads/1789338411150-_MCA7766.jpg',
 'migration/uploads/1789338411150-_MCA7766.jpg',
 'sankara teaching','Trending','2026-09-13T22:26:51.181Z',0,0,0,0,1);
