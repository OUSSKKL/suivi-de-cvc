-- Migration : table des interventions d'astreinte.
-- Chaque technicien note ses sorties d'astreinte (adresse libre — sans lien
-- avec la liste des sites —, date, heure de début et de fin). Permet de
-- suivre, par mois, le nombre de sorties et le total d'heures effectuées.
-- À exécuter une seule fois (Dashboard → SQL Editor → New query → Run).

create table if not exists astreintes (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  address text not null default '',
  date date not null,
  start_time text not null default '',
  end_time text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists astreintes_user_id_idx on astreintes(user_id);

alter table astreintes enable row level security;

create policy "own astreintes" on astreintes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
