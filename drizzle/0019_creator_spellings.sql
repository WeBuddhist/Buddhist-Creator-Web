-- Spellings put right on the cards that came from the team's final sheet
-- (0017): "Combodia", "Monastry" and the like in the one-liners, and four
-- names. Each line is changed only while it still reads as the sheet had
-- it, on a card nobody owns; a card somebody has claimed is theirs.
UPDATE "creator_cards" AS c
SET "tagline" = v."now", "updated_at" = now()
FROM (VALUES
  ('AIGEN STUDIO', 'AI buddhist mantras', 'AI Buddhist mantras'),
  ('Ajhan Anan Dhamma', 'Dharma Teaching', 'Dharma teaching'),
  ('Chea Kimsan Official', 'Dharma Teaching', 'Dharma teaching'),
  ('San Sochea Official', 'Dharma Teaching', 'Dharma teaching'),
  ('Bharat Nakwal', 'Ambedkarism and Buddhist History', 'Ambedkarism and Buddhist history'),
  ('Buddhism for Education of Combodia', 'Combodian monks who are working for education', 'Cambodian monks who are working for education'),
  ('Gaurav Sakya', 'dharma videos and vlogs and lil politics', 'Dharma videos, vlogs and a little politics'),
  ('Guddu Bey', 'Monastry vlogs', 'Monastery vlogs'),
  ('Kamal Shrestha', 'Monastry vlogs', 'Monastery vlogs'),
  ('Hak Sienghai', 'Founder of Buddhism of education of combodia', 'Founder of Buddhism for Education of Cambodia'),
  ('Karma Zangpo Bhutia', 'Dharma Edits and Visuals of Rumtek', 'Dharma edits and visuals of Rumtek'),
  ('Khmer Dhamma Video', 'Dharma videos of Combodian Masters', 'Dharma videos of Cambodian masters'),
  ('Kou Sopheap', 'A very famous combodian monk', 'A very famous Cambodian monk'),
  ('Love Buddhhism', 'Dharma teaching by a upasaka', 'Dharma teaching by an upasaka'),
  ('Tsegyur Nubri', 'Motivation videos based on dhrma', 'Motivation videos based on the Dharma'),
  ('ប៊ុត សាវង្ស(Buth Savong )', 'a very well  known dhamma teacher from combodia', 'A very well-known Dhamma teacher from Cambodia'),
  ('វត្តនិគ្រោធវ័ន "គល់ទទឹង(Wat Nigrodhavan "Kol Torteung")', 'Combodian pagoda page which have dharma teaching and theravada rituals', 'A Cambodian pagoda page with Dharma teaching and Theravada rituals')
) AS v ("display_name", "was", "now")
WHERE c."display_name" = v."display_name" AND c."tagline" = v."was" AND c."user_id" IS NULL;
--> statement-breakpoint
UPDATE "creator_cards" AS c
SET "display_name" = v."now", "updated_at" = now()
FROM (VALUES
  ('Ajhan Anan Dhamma', 'Ajahn Anan Dhamma'),
  ('Buddhism for Education of Combodia', 'Buddhism for Education of Cambodia'),
  ('Love Buddhhism', 'Love Buddhism'),
  ('ប៊ុត សាវង្ស(Buth Savong )', 'ប៊ុត សាវង្ស (Buth Savong)')
) AS v ("was", "now")
WHERE c."display_name" = v."was" AND c."user_id" IS NULL;
