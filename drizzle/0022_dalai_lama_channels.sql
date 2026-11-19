-- His Holiness the Dalai Lama's card gains his YouTube channel and his
-- Facebook page, at the team's word; it had Instagram only. A link the
-- card has already is kept as it stands, and a card somebody has claimed
-- is theirs and is left alone. The counts are not set here: they are
-- read from the two accounts themselves, as every count is.
UPDATE "creator_cards" AS c
SET "socials" = '{"youtube":"https://www.youtube.com/@dalailama","facebook":"https://www.facebook.com/DalaiLama"}'::jsonb || c."socials",
    "updated_at" = now()
WHERE c."display_name" = 'His Holiness the Dalai Lama'
  AND c."user_id" IS NULL AND c."status" = 'approved'
  AND c."socials" ->> 'instagram' = 'https://www.instagram.com/dalailama/';
