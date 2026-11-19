-- Five Facebook links are personal profiles, which give no follower
-- figure to read, so the count beside them could never be kept up.
--
-- Three creators have no other link, and at the team's word leave the
-- list. Only the card the team made is removed: one somebody has claimed
-- since is theirs and stays.
DELETE FROM "creator_cards" AS c
USING (VALUES
  ('Bibek Sakyaputra', 'https://www.facebook.com/Lilavajra'),
  ('Gomchen Rinpoche', 'https://www.facebook.com/dolpogomchen'),
  ('Padma Vajra', 'https://www.facebook.com/padmavajra108')
) AS v ("display_name", "facebook")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" ->> 'facebook' = v."facebook";
--> statement-breakpoint
-- Two creators have other links, and lose only the Facebook one, with
-- whatever was kept for it.
DELETE FROM "creator_follower_checks" AS k
USING "creator_cards" AS c, (VALUES
  ('Bodhisattva', 'https://www.facebook.com/bodhisattva.travels.7'),
  ('Kwangwoo Sunim Dharma Offering', 'https://www.facebook.com/profile.php?id=100027172594584')
) AS v ("display_name", "facebook")
WHERE k."card_id" = c."id" AND k."platform" = 'facebook'
  AND c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" ->> 'facebook' = v."facebook";
--> statement-breakpoint
UPDATE "creator_cards" AS c
SET "socials" = c."socials" - 'facebook', "facebook_followers" = NULL, "updated_at" = now()
FROM (VALUES
  ('Bodhisattva', 'https://www.facebook.com/bodhisattva.travels.7'),
  ('Kwangwoo Sunim Dharma Offering', 'https://www.facebook.com/profile.php?id=100027172594584')
) AS v ("display_name", "facebook")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" ->> 'facebook' = v."facebook";
