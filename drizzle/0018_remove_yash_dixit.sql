-- One creator the team's final sheet no longer has, taken off the list at
-- the team's word. Only the card the team made is removed: one somebody
-- has claimed since is theirs and stays.
DELETE FROM "creator_cards"
WHERE "display_name" = 'Yash Dixit'
  AND "user_id" IS NULL
  AND "socials" ->> 'instagram' = 'https://www.instagram.com/bhagwanji_/';
