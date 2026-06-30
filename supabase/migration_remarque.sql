-- Ajoute une remarque libre par site.
-- (Dashboard Supabase → SQL Editor → New query → coller → Run)
alter table sites add column if not exists remark text not null default '';
