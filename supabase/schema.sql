-- Ikat by Malika Shakirova — Supabase sxemasi
-- Supabase -> SQL Editor -> New query -> shu faylni to'liq qo'yib "Run" bosing.

create extension if not exists pgcrypto;

-- MAHSULOTLAR
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  category    text not null default '',
  price       numeric(14,0) not null default 0 check (price >= 0),
  images      text[] not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- O'LCHAMLAR VA OMBORDAGI SONI
create table if not exists public.product_sizes (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size       text not null,
  stock      int  not null default 0 check (stock >= 0),
  sort       int  not null default 0,
  unique (product_id, size)
);
create index if not exists product_sizes_product_idx on public.product_sizes(product_id);

-- BUYURTMALAR
create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  customer_name text not null,
  phone         text not null,
  address       text not null default '',
  comment       text not null default '',
  tg_user_id    bigint,
  tg_username   text,
  items         jsonb not null,
  total         numeric(14,0) not null,
  status        text not null default 'new'
                check (status in ('new','confirmed','shipped','delivered','cancelled')),
  created_at    timestamptz not null default now()
);

-- Xavfsizlik: jadvallarga faqat server (service_role) kira oladi
alter table public.products      enable row level security;
alter table public.product_sizes enable row level security;
alter table public.orders        enable row level security;

-- Buyurtma berish: narxni bazadan oladi, omborni tekshiradi va kamaytiradi (atomik)
create or replace function public.place_order(
  p_items jsonb, p_name text, p_phone text, p_address text, p_comment text,
  p_tg_id bigint, p_tg_username text
) returns public.orders
language plpgsql security definer set search_path = public as $$
declare
  it      jsonb;
  v_prod  products;
  v_size  product_sizes;
  v_qty   int;
  v_total numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_order orders;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  for it in select value from jsonb_array_elements(p_items) loop
    v_qty := (it->>'qty')::int;
    if v_qty is null or v_qty < 1 or v_qty > 100 then raise exception 'BAD_QTY'; end if;

    select * into v_prod from products where id = (it->>'product_id')::uuid and is_active;
    if not found then raise exception 'NOT_FOUND'; end if;

    select * into v_size from product_sizes
      where product_id = v_prod.id and size = it->>'size' for update;
    if not found or v_size.stock < v_qty then
      raise exception 'OUT_OF_STOCK|% (%)', v_prod.name, it->>'size';
    end if;

    update product_sizes set stock = stock - v_qty where id = v_size.id;

    v_total := v_total + v_prod.price * v_qty;
    v_items := v_items || jsonb_build_object(
      'product_id', v_prod.id, 'name', v_prod.name, 'size', v_size.size,
      'qty', v_qty, 'price', v_prod.price, 'image', coalesce(v_prod.images[1], '')
    );
  end loop;

  insert into orders (customer_name, phone, address, comment, tg_user_id, tg_username, items, total)
  values (p_name, p_phone, coalesce(p_address,''), coalesce(p_comment,''), p_tg_id, p_tg_username, v_items, v_total)
  returning * into v_order;

  return v_order;
end $$;

-- Buyurtmani bekor qilish: mahsulotlarni omborga qaytaradi
create or replace function public.cancel_order(p_order_id bigint)
returns public.orders
language plpgsql security definer set search_path = public as $$
declare v orders; it jsonb;
begin
  select * into v from orders where id = p_order_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if v.status <> 'cancelled' then
    for it in select value from jsonb_array_elements(v.items) loop
      update product_sizes set stock = stock + (it->>'qty')::int
        where product_id = (it->>'product_id')::uuid and size = it->>'size';
    end loop;
    update orders set status = 'cancelled' where id = p_order_id returning * into v;
  end if;
  return v;
end $$;

revoke execute on function public.place_order(jsonb,text,text,text,text,bigint,text) from public, anon, authenticated;
revoke execute on function public.cancel_order(bigint) from public, anon, authenticated;

-- Rasmlar uchun ochiq storage bucket
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do update set public = true;
