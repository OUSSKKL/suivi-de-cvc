-- Schéma Suivi CVC — à exécuter une seule fois dans Supabase
-- (Dashboard → SQL Editor → New query → coller tout → Run)

create table if not exists sites (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  address text not null default '',
  "order" integer,
  kits integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists releves (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id text not null references sites(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now()
);

create table if not exists chaudieres (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id text not null references sites(id) on delete cascade,
  marque text not null default '',
  modele text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

create table if not exists photos (
  id text primary key default gen_random_uuid()::text,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  site_id text not null references sites(id) on delete cascade,
  label text not null default '',
  photo_url text not null,
  date date not null,
  created_at timestamptz not null default now()
);

create index if not exists releves_site_id_idx on releves(site_id);
create index if not exists chaudieres_site_id_idx on chaudieres(site_id);
create index if not exists photos_site_id_idx on photos(site_id);
create index if not exists sites_user_id_idx on sites(user_id);
create index if not exists releves_user_id_idx on releves(user_id);
create index if not exists chaudieres_user_id_idx on chaudieres(user_id);
create index if not exists photos_user_id_idx on photos(user_id);

-- RLS : chaque utilisateur connecté ne voit/modifie que ses propres
-- données. Il n'y a pas de page d'inscription dans l'app : chaque compte
-- se crée depuis le dashboard Supabase (voir le README), et démarre avec
-- une liste de sites vide.
alter table sites enable row level security;
alter table releves enable row level security;
alter table chaudieres enable row level security;
alter table photos enable row level security;

create policy "own sites" on sites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own releves" on releves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own chaudieres" on chaudieres for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own photos" on photos for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Stockage des photos (plaques signalétiques + photos des pompes).
-- Lecture publique (les <img> du navigateur ne sont pas authentifiées),
-- mais écriture/suppression réservées aux utilisateurs connectés.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "public read photos bucket" on storage.objects
  for select using (bucket_id = 'photos');
create policy "auth upload photos bucket" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid() is not null);
create policy "auth delete photos bucket" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid() is not null);

-- Liste initiale des sites (à exécuter une seule fois, sinon les sites
-- seront dupliqués). Remplace ces exemples par tes propres sites, ou
-- ajoute-les directement depuis l'app une fois connecté.
insert into sites (name, "order") values
  ('Résidence Exemple A', 0),
  ('Résidence Exemple B', 1),
  ('12 rue de l''Exemple', 2),
  ('5 avenue Exemple', 3),
  ('Bâtiment Exemple C', 4);

-- Cette liste de départ n'appartient encore à personne (ce script tourne
-- sans utilisateur connecté). Une fois que tu as créé ton compte admin
-- (Authentication → Users → Add user), reviens lancer cette ligne pour
-- te l'attribuer — sinon elle restera invisible pour tout le monde :
-- update sites set user_id = (select id from auth.users order by created_at limit 1) where user_id is null;
