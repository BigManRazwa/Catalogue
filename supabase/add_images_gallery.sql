-- Run in Supabase SQL Editor: add images gallery array
ALTER TABLE products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';
