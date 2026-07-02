-- ============================================================================
--  Suivi CVC — Mise en place de l'ADMIN et des SITES PAR TECHNICIEN
-- ----------------------------------------------------------------------------
--  À exécuter UNE FOIS dans Supabase : Dashboard → SQL Editor → coller → Run.
--  Idempotent : on peut le relancer sans casser (drop/create des policies).
--
--  Principe :
--   - un compte est "admin" si son app_metadata contient {"role":"admin"}.
--     (app_metadata n'est modifiable QUE côté serveur : un tech ne peut pas
--      se promouvoir tout seul.)
--   - table site_assignments : quel technicien s'occupe de quel site.
--   - RLS : l'admin voit/gère TOUT ; un tech ne voit QUE ses sites affectés
--     (et les relevés / chaudières / photos de ces sites).
-- ============================================================================

-- 1) Fonction helper : l'utilisateur courant est-il admin ?
--    Lue depuis le JWT (pas de requête en base → pas de récursion RLS).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

-- 2) Table profiles : miroir léger de auth.users pour afficher les noms
--    d'utilisateur dans l'interface admin (auth.users n'est pas lisible côté
--    client). username = partie avant @ de l'email factice.
create table if not exists public.profiles (
  id       uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Remplit profiles pour les comptes déjà existants.
insert into public.profiles (id, username, is_admin)
select
  u.id,
  split_part(u.email, '@', 1),
  coalesce((u.raw_app_meta_data ->> 'role') = 'admin', false)
from auth.users u
on conflict (id) do nothing;

-- Trigger : chaque nouveau compte crée automatiquement sa ligne profiles.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, is_admin)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce((new.raw_app_meta_data ->> 'role') = 'admin', false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Table d'affectation site ↔ technicien.
create table if not exists public.site_assignments (
  site_id text not null references public.sites(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (site_id, user_id)
);

alter table public.site_assignments enable row level security;

-- ============================================================================
--  POLITIQUES RLS
-- ============================================================================

-- 0) Nettoyage : on supprime TOUTES les politiques existantes sur ces tables
--    pour repartir propre. Indispensable, sinon une ancienne règle "tout le
--    monde voit tout" resterait active (les règles se cumulent en OR) et
--    l'isolation par technicien ne fonctionnerait pas.
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('sites', 'releves', 'chaudieres', 'photos', 'profiles', 'site_assignments')
  loop
    execute format('drop policy if exists %I on public.%I;', r.policyname, r.tablename);
  end loop;
end $$;

-- ---- profiles -------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.is_admin() or id = auth.uid());

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ---- site_assignments -----------------------------------------------------
drop policy if exists sa_select on public.site_assignments;
create policy sa_select on public.site_assignments
  for select using (public.is_admin() or user_id = auth.uid());

-- L'admin gère toutes les affectations ; un tech peut s'auto-affecter un site
-- qu'il vient de créer (user_id = lui-même).
drop policy if exists sa_insert on public.site_assignments;
create policy sa_insert on public.site_assignments
  for insert with check (public.is_admin() or user_id = auth.uid());

drop policy if exists sa_delete on public.site_assignments;
create policy sa_delete on public.site_assignments
  for delete using (public.is_admin() or user_id = auth.uid());

-- ---- sites ----------------------------------------------------------------
-- Visible si admin OU si le site est affecté au tech courant.
alter table public.sites enable row level security;

drop policy if exists sites_select on public.sites;
create policy sites_select on public.sites
  for select using (
    public.is_admin()
    or id in (select site_id from public.site_assignments where user_id = auth.uid())
  );

-- Création : tout compte connecté peut créer un site (il se l'auto-affecte).
drop policy if exists sites_insert on public.sites;
create policy sites_insert on public.sites
  for insert with check (auth.uid() is not null);

drop policy if exists sites_update on public.sites;
create policy sites_update on public.sites
  for update using (
    public.is_admin()
    or id in (select site_id from public.site_assignments where user_id = auth.uid())
  );

drop policy if exists sites_delete on public.sites;
create policy sites_delete on public.sites
  for delete using (
    public.is_admin()
    or id in (select site_id from public.site_assignments where user_id = auth.uid())
  );

-- ---- Tables liées : relevés / chaudières / photos -------------------------
-- Un tech ne peut lire/écrire QUE sur les sites qui lui sont affectés.
-- (Macro appliquée à chaque table via une fonction pour éviter les répétitions.)
do $$
declare
  t text;
begin
  foreach t in array array['releves', 'chaudieres', 'photos'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_all', t);
    execute format($f$
      create policy %I on public.%I
      for all
      using (
        public.is_admin()
        or site_id in (select site_id from public.site_assignments where user_id = auth.uid())
      )
      with check (
        public.is_admin()
        or site_id in (select site_id from public.site_assignments where user_id = auth.uid())
      );
    $f$, t || '_all', t);
  end loop;
end $$;

-- ============================================================================
--  BOOTSTRAP DU COMPTE ADMIN
-- ----------------------------------------------------------------------------
--  1. Crée d'abord le compte admin dans Authentication → Users → Add user
--     (email : admin@suivi-cvc.app, coche "Auto Confirm").
--  2. Puis décommente et exécute la ligne ci-dessous pour le promouvoir :
-- ----------------------------------------------------------------------------
-- update auth.users
--    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
--  where email = 'admin@suivi-cvc.app';
-- update public.profiles set is_admin = true
--  where id = (select id from auth.users where email = 'admin@suivi-cvc.app');
-- ============================================================================
