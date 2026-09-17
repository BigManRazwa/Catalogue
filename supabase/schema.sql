-- ==========================================
-- Sistem Display Catalogue — Supabase Schema
-- Paste this into your Supabase SQL Editor
-- ==========================================

-- Products table
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,
  description    text default '',
  regular_price  numeric(12,2) not null,
  reseller_price numeric(12,2) not null,
  image_url      text default '',
  badge          text default '',
  is_active      boolean default true,
  created_at     timestamptz default now()
);

-- Coupons table
create table if not exists coupons (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,
  discount_pct integer not null check (discount_pct >= 1 and discount_pct <= 100),
  max_uses     integer not null default 100,
  used_count   integer not null default 0,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- Row Level Security
alter table products enable row level security;
alter table coupons  enable row level security;

-- Public read active products
create policy "public_read_products" on products
  for select using (is_active = true);

-- Public read active coupons
create policy "public_read_coupons" on coupons
  for select using (is_active = true);

-- Allow coupon used_count updates
create policy "public_update_coupon_count" on coupons
  for update using (true) with check (true);

-- Full access for admin (internal tool, no auth)
create policy "admin_all_products" on products
  for all using (true) with check (true);

create policy "admin_all_coupons" on coupons
  for all using (true) with check (true);

-- ==========================================
-- Storage bucket for product images
-- ==========================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Allow public to read images
create policy "public_read_images" on storage.objects
  for select using (bucket_id = 'product-images');

-- Allow uploads (admin)
create policy "admin_upload_images" on storage.objects
  for insert with check (bucket_id = 'product-images');

create policy "admin_delete_images" on storage.objects
  for delete using (bucket_id = 'product-images');
