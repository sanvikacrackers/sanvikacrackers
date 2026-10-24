-- =====================================================
-- Sri Veera Fireworks — Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =====================================================

-- Products table
create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  product_code    text unique not null,
  name            text not null,
  category        text not null,
  description     text,
  mrp             numeric,
  price           numeric,
  discount_percentage numeric,
  order_unit      text,
  image_url       text,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Orders table
create table if not exists orders (
  id            uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone         text not null,
  address       text,
  items         text,
  total         numeric,
  status        text default 'Payment Pending',
  created_at    timestamptz default now()
);

-- Enable Row Level Security
alter table products enable row level security;
alter table orders   enable row level security;

-- Public read for products
create policy "Public can read products"
  on products for select using (true);

-- Allow anon to insert/update products (admin uses anon key)
create policy "Anon full access products"
  on products for all using (true) with check (true);

-- Allow anon full access on orders
create policy "Anon full access orders"
  on orders for all using (true) with check (true);

-- =====================================================
-- Seed: Site config rows (special category rows)
-- =====================================================
insert into products (product_code, name, category, description, price, is_active)
values
  ('__settings__', 'Site Settings', '__SITE_SETTINGS__',
   '{"min_order_tn":3000,"min_order_other":5000,"pricelist_url":"","whatsapp":"918300057711"}',
   0, true)
on conflict (product_code) do nothing;

-- =====================================================
-- Seed: Initial product data (from original site)
-- =====================================================

-- Gift Boxes
insert into products (product_code, name, category, mrp, price, discount_percentage, order_unit, is_active)
values
  ('1',  'ROLLS ROYCE VIP CLASSIC',  'Gift Boxes',    4750, 950,  80, '1 Box', true),
  ('2',  'MERCEDES BENZ CLASSIC',    'Gift Boxes',    4000, 800,  80, '1 Box', true),
  ('3',  'TOYOTO FORTUNER DELUXE',   'Gift Boxes',    2800, 560,  80, '1 Box', true),
  ('4',  'FORD ENDEAVOUR',           'Gift Boxes',    2300, 460,  80, '1 Box', true),
  ('5',  'JAGUAR F SUIT',            'Gift Boxes',    3250, 650,  80, '1 Box', true),
  ('6',  'HONDA CITY SPECIAL',       'Gift Boxes',    1850, 370,  80, '1 Box', true),
  ('7',  'UNICORN SPECIAL',          'Gift Boxes',    850,  170,  80, '1 Box', true),
  ('8',  'CBZ Extreme',              'Gift Boxes',    1000, 200,  80, '1 Box', true),
  ('9',  'FZ DELUXE',                'Gift Boxes',    1600, 320,  80, '1 Box', true),

-- Thunder Bolt
  ('10', 'THUNDER BOLT 1K GOLD',     'Thunder Bolt Crackers', 750,   150,  80, '1 Bundle', true),
  ('11', 'THUNDER BOLT 1K PLATINUM', 'Thunder Bolt Crackers', 1650,  330,  80, '1 Bundle', true),
  ('12', 'THUNDER BOLT 2K',          'Thunder Bolt Crackers', 3300,  660,  80, '1 Bundle', true),
  ('13', 'THUNDER BOLT 5K',          'Thunder Bolt Crackers', 8250,  1650, 80, '1 Bundle', true),
  ('14', 'THUNDER BOLT 10K',         'Thunder Bolt Crackers', 16500, 3300, 80, '1 Bundle', true)
on conflict (product_code) do nothing;
