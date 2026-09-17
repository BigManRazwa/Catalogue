-- ==========================================
-- Sistem Display Catalogue — Supabase Schema
-- Paste this into your Supabase SQL Editor
-- ==========================================

-- Products table
create table if not exists products (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category       text not null,
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

-- Anyone can read active products
create policy "public_read_products" on products
  for select using (is_active = true);

-- Anyone can read active coupons
create policy "public_read_coupons" on coupons
  for select using (is_active = true);

-- Allow coupon used_count updates (for redemption tracking)
create policy "public_update_coupon_count" on coupons
  for update using (true) with check (true);

-- Full access for admin ops (since no auth, anon key is used — keep this for internal tool)
create policy "admin_all_products" on products
  for all using (true) with check (true);

create policy "admin_all_coupons" on coupons
  for all using (true) with check (true);

-- ==========================================
-- SEED DATA — Sample Products
-- ==========================================
insert into products (name, category, regular_price, reseller_price, image_url, badge) values
  ('PVC Flex Banner Standard',    'Banner & Flex',    85000,  68000,  'https://picsum.photos/seed/flex1/400/400', ''),
  ('PVC Flex Banner Premium',     'Banner & Flex',   120000,  95000,  'https://picsum.photos/seed/flex2/400/400', 'new'),
  ('Composite PET Film Banner',   'Banner & Flex',   145000, 116000,  'https://picsum.photos/seed/pet1/400/400',  ''),
  ('Eco Solvent Fabric',          'Banner & Flex',   110000,  88000,  'https://picsum.photos/seed/fab1/400/400',  'sale'),
  ('Adhesive Vinyl Glossy',       'Sticker & Vinyl',  75000,  60000,  'https://picsum.photos/seed/vin1/400/400',  ''),
  ('Adhesive Vinyl Matte',        'Sticker & Vinyl',  78000,  62000,  'https://picsum.photos/seed/vin2/400/400',  ''),
  ('Clear Sticker Transparent',   'Sticker & Vinyl',  90000,  72000,  'https://picsum.photos/seed/stk1/400/400',  'new'),
  ('One Way Vision',              'Sticker & Vinyl', 135000, 108000,  'https://picsum.photos/seed/owv1/400/400',  ''),
  ('Lamination Sticker Glossy',   'Sticker & Vinyl',  95000,  76000,  'https://picsum.photos/seed/lam1/400/400',  'sale'),
  ('PET Backlit Film Standard',   'Backlit & Film',  160000, 128000,  'https://picsum.photos/seed/bkl1/400/400',  ''),
  ('PET Backlit Film Premium',    'Backlit & Film',  200000, 160000,  'https://picsum.photos/seed/bkl2/400/400',  'new'),
  ('PP Synthetic Paper',          'Backlit & Film',  105000,  84000,  'https://picsum.photos/seed/pp1/400/400',   ''),
  ('KT Board 5mm',                'Foam & Board',     45000,  36000,  'https://picsum.photos/seed/kt1/400/400',   ''),
  ('PS Foam Board 5mm',           'Foam & Board',     55000,  44000,  'https://picsum.photos/seed/psf1/400/400',  ''),
  ('Paper Foam Board',            'Foam & Board',     50000,  40000,  'https://picsum.photos/seed/pfb1/400/400',  'sale'),
  ('HIPS Board',                  'Foam & Board',     70000,  56000,  'https://picsum.photos/seed/hip1/400/400',  ''),
  ('PP Hollow Board',             'Foam & Board',     65000,  52000,  'https://picsum.photos/seed/pph1/400/400',  'new'),
  ('Retractable Roll Up Banner',  'Display System',  285000, 228000,  'https://picsum.photos/seed/rup1/400/400',  ''),
  ('X-Banner Stand',              'Display System',  180000, 144000,  'https://picsum.photos/seed/xbn1/400/400',  ''),
  ('Pop Up Display System',       'Display System',  850000, 680000,  'https://picsum.photos/seed/pop1/400/400',  'new'),
  ('Tension Fabric Display',      'Display System',  650000, 520000,  'https://picsum.photos/seed/tfb1/400/400',  ''),
  ('Art Canvas',                  'Canvas & Fabric', 130000, 104000,  'https://picsum.photos/seed/cnv1/400/400',  ''),
  ('Silk Fabric',                 'Canvas & Fabric', 115000,  92000,  'https://picsum.photos/seed/slk1/400/400',  'sale'),
  ('PVC Board 3mm',               'PVC & Rigid',      95000,  76000,  'https://picsum.photos/seed/pvc1/400/400',  ''),
  ('PVC Board 5mm',               'PVC & Rigid',     120000,  96000,  'https://picsum.photos/seed/pvc2/400/400',  '');

-- ==========================================
-- SEED DATA — Sample Coupons
-- ==========================================
insert into coupons (code, discount_pct, max_uses, used_count) values
  ('RESELLER10', 10, 100,  0),
  ('BULK20',     20,  50,  0),
  ('SPECIAL15',  15, 200,  0);
