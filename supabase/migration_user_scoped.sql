-- Migration : isole les données par compte. Chaque utilisateur ne voit et
-- ne modifie que ses propres sites (et les relevés/chaudières/photos qui
-- en dépendent). Un nouveau compte démarre donc avec une liste vide.
--
-- À exécuter une seule fois, maintenant que tu as déjà créé ton compte
-- admin et AVANT de créer des comptes pour les techniciens (les données
-- existantes seront attribuées au premier compte créé, c'est-à-dire toi).

alter table sites add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table releves add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table chaudieres add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table photos add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Attribue toutes les données déjà existantes au premier compte créé.
update sites set user_id = (select id from auth.users order by created_at limit 1) where user_id is null;
update releves set user_id = (select s.user_id from sites s where s.id = releves.site_id) where user_id is null;
update chaudieres set user_id = (select s.user_id from sites s where s.id = chaudieres.site_id) where user_id is null;
update photos set user_id = (select s.user_id from sites s where s.id = photos.site_id) where user_id is null;

alter table sites alter column user_id set not null;
alter table releves alter column user_id set not null;
alter table chaudieres alter column user_id set not null;
alter table photos alter column user_id set not null;

-- Désormais, toute nouvelle ligne est automatiquement rattachée à
-- l'utilisateur connecté qui la crée (aucun changement de code requis).
alter table sites alter column user_id set default auth.uid();
alter table releves alter column user_id set default auth.uid();
alter table chaudieres alter column user_id set default auth.uid();
alter table photos alter column user_id set default auth.uid();

create index if not exists sites_user_id_idx on sites(user_id);
create index if not exists releves_user_id_idx on releves(user_id);
create index if not exists chaudieres_user_id_idx on chaudieres(user_id);
create index if not exists photos_user_id_idx on photos(user_id);

-- Remplace les politiques "tout utilisateur connecté voit tout" par
-- "chacun ne voit/modifie que ce qui lui appartient".
drop policy if exists "auth all sites" on sites;
drop policy if exists "auth all releves" on releves;
drop policy if exists "auth all chaudieres" on chaudieres;
drop policy if exists "auth all photos" on photos;

create policy "own sites" on sites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own releves" on releves for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own chaudieres" on chaudieres for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own photos" on photos for all using (user_id = auth.uid()) with check (user_id = auth.uid());
