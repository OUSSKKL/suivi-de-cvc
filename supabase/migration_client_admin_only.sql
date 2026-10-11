-- Seul l'admin peut changer le client d'un site.
-- Un technicien peut toujours modifier ses sites (kits, remarque…), mais
-- toute tentative de changer la colonne "client" est refusée.
-- Colle tout ceci dans Supabase → SQL Editor → Run.

create or replace function public.protect_site_client()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() est null pour le SQL Editor / service : on laisse passer.
  if new.client is distinct from old.client
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Seul l''admin peut changer le client d''un site.';
  end if;
  return new;
end;
$$;

drop trigger if exists sites_protect_client on public.sites;
create trigger sites_protect_client
  before update on public.sites
  for each row execute function public.protect_site_client();
