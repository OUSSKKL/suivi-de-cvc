-- Migration : historique des nettoyages des pots à boue, sur le même
-- principe que les relevés de compteurs (bouton "Nettoyage" + date, liste
-- des passages, suppression possible d'une entrée).
--
-- À exécuter une seule fois dans Supabase (Dashboard → SQL Editor → New
-- query → coller → Run).

create table if not exists nettoyages_pot_boue (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id text not null references sites(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists nettoyages_pot_boue_site_id_idx on nettoyages_pot_boue(site_id);
create index if not exists nettoyages_pot_boue_user_id_idx on nettoyages_pot_boue(user_id);

alter table nettoyages_pot_boue enable row level security;

drop policy if exists "own nettoyages_pot_boue" on nettoyages_pot_boue;
create policy "own nettoyages_pot_boue" on nettoyages_pot_boue
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
