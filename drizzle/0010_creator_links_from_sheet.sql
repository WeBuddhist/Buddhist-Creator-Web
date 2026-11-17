-- The team's sheet, read again: 26 creators now have the link to their
-- channel or page, and with it (where the page shows one) their profile
-- picture. A card somebody has claimed since is theirs to change and is
-- left alone, and a card that already has a picture keeps it.
UPDATE "creator_cards" AS c
SET "socials" = c."socials" || v."socials",
    "photo_key" = coalesce(c."photo_key", v."photo_key"),
    "updated_at" = now()
FROM (VALUES
  ('Ted Kunchok', '{"youtube":"https://www.youtube.com/@TedKunchok"}'::jsonb, 'creator-cards/profile-pictures/b3cd2b09-9cea-49ff-b7f7-e71e3f5e21f4.webp'),
  ('Uttam Mangalam', '{"youtube":"https://www.youtube.com/@uttammangalam"}'::jsonb, 'creator-cards/profile-pictures/952c71e4-320d-4ffd-b9f2-a158f3b01c7e.webp'),
  ('Pong Re Rinpoche', '{"facebook":"https://www.facebook.com/PongReRinpoche"}'::jsonb, 'creator-cards/profile-pictures/739993c5-90b6-4067-9d45-a01523823dd9.webp'),
  ('Padma Vajra', '{"facebook":"https://www.facebook.com/padmavajra108"}'::jsonb, 'creator-cards/profile-pictures/b7c12c07-5a96-4f3e-b9aa-a3fcbef7d91c.webp'),
  ('Gomchen Rinpoche', '{"facebook":"https://www.facebook.com/dolpogomchen"}'::jsonb, NULL),
  ('Chokyi Nyima Rinpoche', '{"facebook":"https://www.facebook.com/Chokyi.Nyima.Rinpoche"}'::jsonb, 'creator-cards/profile-pictures/1db3ba3f-5ba6-4161-8fb5-4c2879ecd123.webp'),
  ('Ani Yangchen Dolma', '{"facebook":"https://www.facebook.com/nishchal.pakhrin"}'::jsonb, 'creator-cards/profile-pictures/c714a678-364d-4286-b5ec-a8d6aecbd367.webp'),
  ('Bibek Sakyaputra', '{"facebook":"https://www.facebook.com/Lilavajra"}'::jsonb, NULL),
  ('Bodhi Television', '{"youtube":"https://www.youtube.com/@BodhiTelevisionNepal"}'::jsonb, 'creator-cards/profile-pictures/6c0563d4-3d84-4ae7-b5a0-49e6b69109bb.webp'),
  ('NB TV', '{"youtube":"https://www.youtube.com/@Nepalbuddhisttv"}'::jsonb, 'creator-cards/profile-pictures/3b18b964-4291-4534-8bda-e81e0a3157a4.webp'),
  ('Buddhism Podcast', '{"youtube":"https://www.youtube.com/@BuddhismPodcast"}'::jsonb, 'creator-cards/profile-pictures/7b608c83-ca04-4d8a-a5f8-85816c053c44.webp'),
  ('The Modern Buddhism Podcast', '{"youtube":"https://www.youtube.com/@modernbuddhismpodcast"}'::jsonb, 'creator-cards/profile-pictures/57663bee-5aec-48b5-8e09-ee718ac06831.webp'),
  ('Ego (Buddhism Podcast)', '{"youtube":"https://www.youtube.com/@buddhismpodcastenglish"}'::jsonb, 'creator-cards/profile-pictures/26eda09d-cf8f-4a83-a316-90876613371a.webp'),
  ('Anup Panthi', '{"youtube":"https://www.youtube.com/@AnupPanthi"}'::jsonb, 'creator-cards/profile-pictures/e9691d53-8310-4de5-a162-1e31ce9a08cd.webp'),
  ('Buddhism in English', '{"youtube":"https://www.youtube.com/@BuddhismInEnglish"}'::jsonb, 'creator-cards/profile-pictures/58b7cad8-d970-484f-984d-7b627a9837e4.webp'),
  ('Buddhas Wizdom', '{"youtube":"https://www.youtube.com/@BuddhasWizdom"}'::jsonb, 'creator-cards/profile-pictures/078fe784-2398-4865-a233-36df2b165a2a.webp'),
  ('The Buddhist Media Network', '{"youtube":"https://www.youtube.com/@TheBuddhistMediaNetwork"}'::jsonb, 'creator-cards/profile-pictures/3810806f-8c6c-4598-8de5-2cbcb7aea100.webp'),
  ('Wisdom Sutra Media', '{"youtube":"https://www.youtube.com/@wisdomsutramedia"}'::jsonb, 'creator-cards/profile-pictures/7369fbea-dac2-4287-9815-aaf39a059c25.webp'),
  ('Lord Buddha TV', '{"youtube":"https://www.youtube.com/@lordbuddhatelevision"}'::jsonb, 'creator-cards/profile-pictures/97684ea5-3142-4b48-8060-a1c4fc56fb8d.webp'),
  ('Study Buddhism', '{"youtube":"https://www.youtube.com/@studybuddhism"}'::jsonb, NULL),
  ('Bhante Devananda', '{"facebook":"https://www.facebook.com/BhanteDevananda"}'::jsonb, 'creator-cards/profile-pictures/07af8b2b-5142-4403-88f4-dfbc8f2bc113.webp'),
  ('84000: Translating the Words of the Buddha', '{"facebook":"https://www.facebook.com/Translate84000"}'::jsonb, 'creator-cards/profile-pictures/3226496c-be53-4b87-a1ae-35e226c6a8c9.webp'),
  ('Dagmo Kalden La', '{"facebook":"https://www.facebook.com/dagmola"}'::jsonb, 'creator-cards/profile-pictures/72b5fbd8-a830-430d-9dc6-bc6faa0a55df.webp'),
  ('Bhuchung Kata', '{"facebook":"https://www.facebook.com/kata.sontsa"}'::jsonb, 'creator-cards/profile-pictures/81aa8f8a-49d6-4b1a-adbc-1f46c62307e0.webp'),
  ('Bumo Gangkar Metok', '{"youtube":"https://www.youtube.com/@bumogangkarmetok9012"}'::jsonb, 'creator-cards/profile-pictures/8f352c67-8ebd-4c4a-b181-62784cb9eec7.webp'),
  ('Kailash Bauddha', '{"youtube":"https://www.youtube.com/@KailashBauddha"}'::jsonb, 'creator-cards/profile-pictures/b74e89f7-cf24-4433-9228-7e50fa3089f1.webp')
) AS v ("display_name", "socials", "photo_key")
WHERE c."display_name" = v."display_name" AND c."user_id" IS NULL AND c."status" = 'approved';
--> statement-breakpoint
-- One creator the sheet has gained since. Only a name and a country so far.
INSERT INTO "creator_cards" ("status", "reviewed_at", "display_name", "country")
VALUES ('approved', now(), 'พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)', 'Thailand');
