-- Migration : ajoute une quantité par fiche chaudière. Permet de regrouper
-- plusieurs unités identiques (même marque/modèle) sous une seule fiche,
-- avec un compteur +/- au lieu de créer une fiche par unité.
--
-- À exécuter une seule fois dans Supabase (Dashboard → SQL Editor → New
-- query → coller → Run).

alter table chaudieres add column if not exists quantite integer not null default 1;
