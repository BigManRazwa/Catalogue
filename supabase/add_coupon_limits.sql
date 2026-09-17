-- Run in Supabase SQL Editor: add coupon limits + description
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS description text DEFAULT '';
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS min_price numeric DEFAULT 0;
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS max_items integer DEFAULT 0;
-- min_price = 0 means no price limit
-- max_items = 0 means no item limit (applies to everything)
