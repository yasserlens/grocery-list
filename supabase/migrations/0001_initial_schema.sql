create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

create table if not exists public.lists (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  share_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  title text not null default '',
  body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists notes_list_id_idx on public.notes(list_id);

create table if not exists public.note_items (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  raw_text text not null,
  normalized_text text not null,
  quantity text,
  category text not null default 'other',
  emoji text not null default '🛒',
  source text not null default 'fallback',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists note_items_note_id_idx on public.note_items(note_id);
create index if not exists note_items_normalized_text_idx on public.note_items(normalized_text);

create table if not exists public.item_assignments (
  normalized_text text primary key,
  category text not null,
  emoji text not null,
  confidence real not null default 0.5,
  source text not null,
  updated_at timestamptz not null default now()
);
create index if not exists item_assignments_trgm_idx
  on public.item_assignments using gin (normalized_text gin_trgm_ops);

create table if not exists public.assignment_corrections (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.lists(id) on delete set null,
  normalized_text text not null,
  old_category text,
  old_emoji text,
  new_category text not null,
  new_emoji text not null,
  created_at timestamptz not null default now()
);
create index if not exists assignment_corrections_list_id_idx on public.assignment_corrections(list_id);
create index if not exists assignment_corrections_normalized_text_idx on public.assignment_corrections(normalized_text);
