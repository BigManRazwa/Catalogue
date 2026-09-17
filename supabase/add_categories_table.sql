-- Run this in Supabase SQL Editor to add the categories table
CREATE TABLE IF NOT EXISTS categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text UNIQUE NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "admin_all_categories" ON categories
  FOR ALL USING (true) WITH CHECK (true);

-- Seed with the existing categories
INSERT INTO categories (name, sort_order) VALUES
  ('Banner & Flex',    1),
  ('Sticker & Vinyl',  2),
  ('Backlit & Film',   3),
  ('Foam & Board',     4),
  ('Display System',   5),
  ('Canvas & Fabric',  6),
  ('PVC & Rigid',      7)
ON CONFLICT (name) DO NOTHING;
