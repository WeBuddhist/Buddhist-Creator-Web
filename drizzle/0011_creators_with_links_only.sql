-- The team's sheet, read a third time. Seven more creators have their
-- link, and with it their profile picture. As before, a card somebody has
-- claimed since is theirs and is left alone.
UPDATE "creator_cards" AS c
SET "socials" = c."socials" || v."socials",
    "photo_key" = coalesce(c."photo_key", v."photo_key"),
    "updated_at" = now()
FROM (VALUES
  ('Rahul Dongre', '{"instagram":"https://www.instagram.com/mr.rahuldongre/"}'::jsonb, 'creator-cards/profile-pictures/c840a236-8d76-41f5-bb1f-ead1b7cff8ed.webp'),
  ('Rangjung Yeshe Institute', '{"instagram":"https://www.instagram.com/rangjung_yeshe_institute/"}'::jsonb, 'creator-cards/profile-pictures/16ce0e1d-2110-4392-b3c3-7a314fe6ccd2.webp'),
  ('Lama Zopa Rinpoche', '{"instagram":"https://www.instagram.com/lamazoparinpoche/"}'::jsonb, 'creator-cards/profile-pictures/49215e43-be00-4e71-b198-199cfffd762b.webp'),
  ('His Holiness the Dalai Lama', '{"instagram":"https://www.instagram.com/dalailama/"}'::jsonb, 'creator-cards/profile-pictures/dfa6dacb-a156-4fdb-b355-3994e6fd2a6a.webp'),
  ('Thosamling Nunnery', '{"facebook":"https://www.facebook.com/thosamling"}'::jsonb, 'creator-cards/profile-pictures/c5e74a6f-eade-4a4c-9f0b-d9554e662c63.webp'),
  ('Yongey Mingyur Rinpoche', '{"facebook":"https://www.facebook.com/mingyur.rinpoche"}'::jsonb, 'creator-cards/profile-pictures/630d6280-e463-418d-a1c6-e315499bfd76.webp'),
  ('Ancient Buddha', '{"facebook":"https://www.facebook.com/ancientbuddha91"}'::jsonb, 'creator-cards/profile-pictures/09c3fbea-f9f8-49b0-9c6a-7f59e884e52a.webp')
) AS v ("display_name", "socials", "photo_key")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL AND c."status" = 'approved';
--> statement-breakpoint
-- The creator added in 0010 with a name only: the sheet now has the rest.
-- Facebook shows no picture for this page without a sign-in.
UPDATE "creator_cards"
SET "socials" = "socials" || '{"facebook":"https://www.facebook.com/v.vajiramedhi"}'::jsonb,
    "facebook_followers" = 5900000,
    "tagline" = 'A famous Buddhist teacher from Thailand, on Dharma activities',
    "updated_at" = now()
WHERE "display_name" = 'พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)' AND "user_id" IS NULL AND "status" = 'approved';
--> statement-breakpoint
-- One more creator from the sheet.
INSERT INTO "creator_cards" ("status", "reviewed_at", "display_name", "country", "tagline", "photo_key", "socials", "facebook_followers")
VALUES ('approved', now(), 'พระศักดา สุนฺทโร (Phra Sakda Suntharo)', 'Thailand', 'A famous Buddhist teacher from Thailand, on the Dharma and motivation', 'creator-cards/profile-pictures/71bcb697-ded9-4a23-a116-2dc494b4946b.webp', '{"facebook":"https://www.facebook.com/sakda979"}'::jsonb, 5200000);
--> statement-breakpoint
-- The directory lists a creator only with somewhere to find them. The
-- cards the team made that still have no link are taken out: the creators
-- the sheet gives no link or username for, and those whose Instagram
-- username does not exist as written or belongs to another account. Such a
-- card never had a picture, so nothing is left behind in the bucket. A
-- card with an owner, or one a creator made, is never touched.
DELETE FROM "creator_cards"
WHERE "user_id" IS NULL AND "submitted_at" IS NULL AND "socials" = '{}'::jsonb;
