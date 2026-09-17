-- Run this in your Supabase SQL Editor to add the hover image column
ALTER TABLE products ADD COLUMN IF NOT EXISTS hover_image_url text default '';
