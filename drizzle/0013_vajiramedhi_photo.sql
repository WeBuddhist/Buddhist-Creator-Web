-- The picture for a card that had none. This creator's Facebook page shows
-- signed-out visitors a sign-in screen, so there was nothing to read the
-- picture from; Facebook's public picture address for the page has it. A
-- card somebody has claimed, or given a photo, since is left alone.
UPDATE "creator_cards"
SET "photo_key" = 'creator-cards/profile-pictures/87d49430-3bab-4405-99b4-c166ee7f56d7.webp', "updated_at" = now()
WHERE "display_name" = 'พระเมธีวชิโรดม - ว.วชิรเมธี (Phra Methee Vajirodom – V. Vajiramedhi)'
  AND "user_id" IS NULL AND "photo_key" IS NULL;
