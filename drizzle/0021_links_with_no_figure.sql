-- Five links the first full reading of the counts (18 November 2026)
-- could get no figure from: a Facebook page that gives none, and four
-- TikTok accounts that do not exist. At the team's word the links go, with
-- whatever was kept for them, and a creator left with no link at all
-- leaves the list. Only cards the team made are touched: one somebody
-- has claimed since is theirs and stays as it is.
DELETE FROM "creator_follower_checks" AS k
USING "creator_cards" AS c, (VALUES
  ('พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)', 'facebook', 'https://www.facebook.com/v.vajiramedhi'),
  ('Ani Yangchen Dolma', 'tiktok', 'https://www.tiktok.com/@aniyangchendolma'),
  ('Buddha-တရားတော်', 'tiktok', 'https://www.tiktok.com/@dhamma_yeikthar'),
  ('Edapoyo Jushoku', 'tiktok', 'https://www.tiktok.com/@edahiro_jushoku'),
  ('Wat Phra Buddha Sangdham (Dhammayut)', 'tiktok', 'https://www.tiktok.com/@wadprabuddhasangdham')
) AS v ("display_name", "platform", "link")
WHERE k."card_id" = c."id" AND k."platform" = v."platform"
  AND c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" ->> v."platform" = v."link";
--> statement-breakpoint
UPDATE "creator_cards" AS c
SET "socials" = c."socials" - v."platform",
    "facebook_followers" = CASE WHEN v."platform" = 'facebook' THEN NULL ELSE c."facebook_followers" END,
    "tiktok_followers" = CASE WHEN v."platform" = 'tiktok' THEN NULL ELSE c."tiktok_followers" END,
    "updated_at" = now()
FROM (VALUES
  ('พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)', 'facebook', 'https://www.facebook.com/v.vajiramedhi'),
  ('Ani Yangchen Dolma', 'tiktok', 'https://www.tiktok.com/@aniyangchendolma'),
  ('Buddha-တရားတော်', 'tiktok', 'https://www.tiktok.com/@dhamma_yeikthar'),
  ('Edapoyo Jushoku', 'tiktok', 'https://www.tiktok.com/@edahiro_jushoku'),
  ('Wat Phra Buddha Sangdham (Dhammayut)', 'tiktok', 'https://www.tiktok.com/@wadprabuddhasangdham')
) AS v ("display_name", "platform", "link")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" ->> v."platform" = v."link";
--> statement-breakpoint
-- Of those creators, the ones with no link left.
DELETE FROM "creator_cards" AS c
USING (VALUES
  ('พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)', 'facebook', 'https://www.facebook.com/v.vajiramedhi'),
  ('Ani Yangchen Dolma', 'tiktok', 'https://www.tiktok.com/@aniyangchendolma'),
  ('Buddha-တရားတော်', 'tiktok', 'https://www.tiktok.com/@dhamma_yeikthar'),
  ('Edapoyo Jushoku', 'tiktok', 'https://www.tiktok.com/@edahiro_jushoku'),
  ('Wat Phra Buddha Sangdham (Dhammayut)', 'tiktok', 'https://www.tiktok.com/@wadprabuddhasangdham')
) AS v ("display_name", "platform", "link")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL
  AND c."socials" = '{}'::jsonb;
