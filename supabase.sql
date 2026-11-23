-- Ikat by Malika Shakirova — Supabase jadvallari
-- Supabase → SQL Editor → New query → shu faylning HAMMASINI qo'ying → RUN.
-- Qayta ishga tushirsangiz ham zarari yo'q. Eski products / orders jadvallariga tegmaydi.

-- 1) Hujjatlar: mijozlar, mahsulotlar, buyurtmalar, hisobot, sozlamalar
create table if not exists public.ikat_kv (
  col        text        not null,
  id         text        not null,
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (col, id)
);

-- 2) Fayllar: mahsulot rasmlari, cheklar, avatarlar (base64)
create table if not exists public.ikat_files (
  id         text        primary key,
  mime       text        not null,
  data       text        not null,
  created_at timestamptz not null default now()
);

-- 3) Jadvallarni faqat serverning yashirin kaliti ochadi
alter table public.ikat_kv    enable row level security;
alter table public.ikat_files enable row level security;
revoke all on public.ikat_kv, public.ikat_files from anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on public.ikat_kv, public.ikat_files to service_role;

-- 4) Supabase jadvallarni darrov ko'rsin
notify pgrst, 'reload schema';
