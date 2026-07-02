-- ============================================================================
--  Suivi CVC — Coordonnées carte EN BASE + création de site réservée à l'admin
-- ----------------------------------------------------------------------------
--  À exécuter UNE FOIS dans Supabase : SQL Editor → coller → Run.
--  (À faire APRÈS admin_setup.sql.)
--
--  Pourquoi : jusqu'ici la position d'un site sur la carte était stockée dans
--  le navigateur (localStorage) → chaque appareil avait la sienne. En la
--  mettant dans la table `sites`, l'admin place un point et TOUS les techniciens
--  concernés le voient (données partagées).
-- ============================================================================

-- 1) Coordonnées du site (nullable : un site peut ne pas être encore placé).
alter table public.sites
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- 2) Seul l'admin peut CRÉER un site (les techniciens ne peuvent plus en ajouter).
--    (La lecture/mise à jour reste réglée par admin_setup.sql : un tech garde
--     l'accès en écriture à ses sites affectés pour les kits/remarques/position.)
drop policy if exists sites_insert on public.sites;
create policy sites_insert on public.sites
  for insert with check (public.is_admin());
