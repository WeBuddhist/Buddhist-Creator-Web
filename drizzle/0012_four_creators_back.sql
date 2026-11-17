-- Four of the creators 0011 took out for want of a link, back with the
-- right one: the sheet had each Instagram username misspelt. Each is a new
-- card, approved and unclaimed like the rest, with its profile picture.
INSERT INTO "creator_cards" ("status", "reviewed_at", "display_name", "country", "tagline", "photo_key", "socials", "instagram_followers")
SELECT 'approved'::"creator_card_status", now(), v.* FROM (VALUES
  ('Munpa Rabsel', 'India', 'A Buddhist nun''s content', 'creator-cards/profile-pictures/875b6e33-3186-4741-bf4d-4a188a736225.webp', '{"instagram":"https://www.instagram.com/munpa.rabsel/"}'::jsonb, 3078),
  ('Young Buddhist Association of Indonesia', 'Indonesia', 'Buddhist youth activities', 'creator-cards/profile-pictures/b5f5dbdb-de00-4142-8e1c-c72ddd285747.webp', '{"instagram":"https://www.instagram.com/youngbuddhistassociation/"}'::jsonb, 1500000),
  ('Serkong Institute', 'India', 'Dharma videos', 'creator-cards/profile-pictures/763c235d-a636-4941-a056-f90d5ffa5f17.webp', '{"instagram":"https://www.instagram.com/serkong_institute/"}'::jsonb, 2534),
  ('Flowering Dharma', 'India', 'A Ladakhi Buddhist youth page, with Dharma teachings', 'creator-cards/profile-pictures/01f3aa51-26be-4234-9a78-752b5faffc3e.webp', '{"instagram":"https://www.instagram.com/floweringdharma/"}'::jsonb, 24000)
) AS v ("display_name", "country", "tagline", "photo_key", "socials", "instagram_followers");
