-- The country and the line about his work for Dzongsar Jamyang
-- Khyentse's card (0023), which had neither: the country as the team
-- gave it, the line written for the card at the team's asking. Only what
-- is still empty is filled, on the card the team made; a card he has
-- claimed since is his and is left alone.
UPDATE "creator_cards"
SET "country" = coalesce("country", 'Bhutan'),
    "tagline" = coalesce("tagline", 'Buddhist teacher, author and filmmaker, sharing Dharma teachings and reflections'),
    "updated_at" = now()
WHERE "display_name" = 'Dzongsar Jamyang Khyentse'
  AND "user_id" IS NULL
  AND "socials" ->> 'facebook' = 'https://www.facebook.com/djkhyentse'
  AND ("country" IS NULL OR "tagline" IS NULL);
