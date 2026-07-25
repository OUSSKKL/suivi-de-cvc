-- Migration : ajoute l'onglet Adoucisseur (état marche/HS, usage ECS/chauffage,
-- sel en stock) et l'onglet Pot à boue (fiches modèle + plaque signalétique,
-- comme les chaudières, avec un stock de poches de rechange).
--
-- À exécuter une seule fois dans Supabase (Dashboard → SQL Editor → New
-- query → coller → Run).

alter table sites add column if not exists adoucisseur_etat text not null default 'marche';
alter table sites add column if not exists adoucisseur_usage text not null default 'ecs';
alter table sites add column if not exists adoucisseur_sel integer not null default 0;
alter table sites add column if not exists poches integer not null default 0;

create table if not exists pots_boue (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id text not null references sites(id) on delete cascade,
  modele text not null default '',
  quantite integer not null default 1,
  photo_url text,
  created_at timestamptz not null default now()
);

create index if not exists pots_boue_site_id_idx on pots_boue(site_id);
create index if not exists pots_boue_user_id_idx on pots_boue(user_id);

alter table pots_boue enable row level security;

drop policy if exists "own pots_boue" on pots_boue;
create policy "own pots_boue" on pots_boue
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
