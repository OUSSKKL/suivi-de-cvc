-- Migration : l'adoucisseur devient "non configuré" par défaut (au lieu de
-- Marche/ECS automatique), car certains sites n'ont pas d'adoucisseur du
-- tout. Un site n'apparaît "équipé" dans la liste qu'une fois qu'on a appuyé
-- sur Marche/HS ET ECS/Chauffage dans son onglet Adoucisseur.
--
-- À exécuter une seule fois dans Supabase (Dashboard → SQL Editor → New
-- query → coller → Run).

alter table sites alter column adoucisseur_etat drop not null;
alter table sites alter column adoucisseur_etat drop default;
alter table sites alter column adoucisseur_usage drop not null;
alter table sites alter column adoucisseur_usage drop default;

-- Remet à zéro les valeurs déjà posées automatiquement par la migration
-- précédente (avant que cette règle n'existe), pour ne pas laisser des sites
-- sans adoucisseur apparaître comme "Marche / ECS" par erreur.
update sites set adoucisseur_etat = null, adoucisseur_usage = null;
