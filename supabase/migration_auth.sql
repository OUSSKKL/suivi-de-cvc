-- Migration : passe d'un accès ouvert à un accès réservé aux utilisateurs
-- connectés. À exécuter une seule fois dans le SQL Editor de ton projet
-- Supabase existant (celui où tu as déjà lancé schema.sql).

drop policy if exists "allow all sites" on sites;
drop policy if exists "allow all releves" on releves;
drop policy if exists "allow all chaudieres" on chaudieres;
drop policy if exists "allow all photos" on photos;

create policy "auth all sites" on sites for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth all releves" on releves for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth all chaudieres" on chaudieres for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "auth all photos" on photos for all using (auth.uid() is not null) with check (auth.uid() is not null);

drop policy if exists "anon upload photos bucket" on storage.objects;
drop policy if exists "anon delete photos bucket" on storage.objects;

create policy "auth upload photos bucket" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid() is not null);
create policy "auth delete photos bucket" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid() is not null);
