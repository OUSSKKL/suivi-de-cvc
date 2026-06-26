-- Migration : retire la policy de lecture trop large sur le bucket photos.
-- Pour un bucket public, le téléchargement par URL directe ne passe pas
-- par les policies RLS — cette policy ne servait qu'à autoriser la liste
-- complète des fichiers via l'API, ce qui n'est jamais utilisé par l'app
-- et expose plus de données que nécessaire. À exécuter une seule fois.

drop policy if exists "public read photos bucket" on storage.objects;
