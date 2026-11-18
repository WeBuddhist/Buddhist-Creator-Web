-- One more creator the team knows, added at its word: Dzongsar Jamyang
-- Khyentse, with his Facebook page and his Instagram. Approved as it is
-- made and owned by nobody until he claims it, like the rest; the country
-- and the line about his work were not given and are left empty. The
-- picture is his own Facebook profile picture, stored under
-- creator-cards/profile-pictures/. The counts are read from the two
-- accounts themselves, not set here.
INSERT INTO "creator_cards" ("status", "reviewed_at", "display_name", "photo_key", "socials")
SELECT 'approved'::"creator_card_status", now(), 'Dzongsar Jamyang Khyentse',
       'creator-cards/profile-pictures/d5f5676f-c224-4f2d-b7da-41dab574c248.webp',
       '{"instagram":"https://www.instagram.com/khyentse/","facebook":"https://www.facebook.com/djkhyentse"}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM "creator_cards" WHERE "socials" ->> 'facebook' = 'https://www.facebook.com/djkhyentse'
);
