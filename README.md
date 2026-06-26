# Suivi CVC

Application web (React + Vite + Tailwind) pour suivre les relevés de compteurs, les chaudières et les photos de plusieurs sites/bâtiments. Les données sont stockées dans une base **Supabase** (Postgres + stockage de fichiers en ligne), accessible depuis n'importe quel appareil connecté à internet.

## Configurer la base de données (à faire une seule fois)

1. Crée un compte gratuit sur [supabase.com](https://supabase.com) puis un nouveau projet (choisis un nom, une région proche, et un mot de passe de base de données — garde-le de côté, on ne s'en ressert pas ici).
2. Dans le projet, ouvre **SQL Editor** → **New query**, colle tout le contenu du fichier [`supabase/schema.sql`](supabase/schema.sql) de ce dépôt, puis clique sur **Run**. Ça crée les tables, le stockage des photos, et quelques sites d'exemple (à remplacer par les tiens).
   ⚠️ Ne lance ce script qu'une seule fois : le relancer dupliquerait la liste des sites.
3. Va dans **Project Settings → API**, et récupère :
   - **Project URL**
   - **anon public key**
4. À la racine du projet, copie `.env.example` vers `.env` et colle ces deux valeurs :
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
5. Relance `npm run dev` (ou redéploie l'app si elle est déjà en ligne).

Tant que `.env` n'est pas rempli, l'app affiche un écran "Base de données non configurée" avec ces mêmes instructions.

## Authentification (accès réservé)

L'app n'a pas de page d'inscription : c'est un écran de connexion uniquement, avec un nom d'utilisateur (pas un email). Le ou les comptes se créent depuis le dashboard Supabase (le "backoffice"), jamais depuis l'app elle-même.

**Important :** Supabase Auth fonctionne avec un email, pas un pseudo. L'app convertit donc ton nom d'utilisateur en un faux email du type `pseudo@suivi-cvc.app` (voir `usernameToEmail` dans [`src/lib/supabaseClient.js`](src/lib/supabaseClient.js)) — c'est cet email-là (pas un vrai) qu'il faut saisir dans le dashboard. Aucun mail n'est jamais envoyé à cette adresse.

1. **Si ton projet existait déjà avant cette mise à jour** : ouvre **SQL Editor** → **New query**, colle le contenu de [`supabase/migration_auth.sql`](supabase/migration_auth.sql) et **Run**. (Sur un projet tout neuf, `schema.sql` suffit, il contient déjà les bonnes règles.)
2. Crée ton compte admin : **Authentication → Users → Add user**. Comme email, mets `tonpseudo@suivi-cvc.app` (remplace `tonpseudo` par le nom d'utilisateur que tu veux utiliser, en minuscules, sans espaces), choisis un mot de passe, et coche **Auto Confirm User**. C'est `tonpseudo` + ce mot de passe que tu utiliseras dans l'écran de connexion de l'app.
3. Empêche toute autre création de compte : **Authentication → Sign In / Providers** (ou **Settings** selon la version du dashboard) → désactive **Allow new users to sign up**. Comme ça, même si quelqu'un récupère la clé "anon", il ne peut pas créer de compte — seul celui que tu as créé manuellement existe.

Pour ajouter quelqu'un d'autre plus tard, c'est la même chose : **Authentication → Users → Add user** avec `sonpseudo@suivi-cvc.app`, jamais depuis l'app.

**Chaque compte a ses propres sites.** Les sites, relevés, chaudières et photos sont rattachés au compte qui les a créés — un nouveau compte (un technicien) démarre avec une liste vide et ajoute ses propres sites ; il ne voit pas ceux des autres comptes. C'est géré par [`supabase/migration_user_scoped.sql`](supabase/migration_user_scoped.sql) (à lancer une fois, **avant** de créer des comptes pour d'autres techniciens — les sites déjà existants sont automatiquement attribués au premier compte créé, c'est-à-dire toi).

**Mot de passe oublié :** comme l'email est factice, le "mot de passe oublié" classique par email ne peut pas fonctionner. Si besoin, réinitialise le mot de passe directement depuis **Authentication → Users** → clique sur le compte → **Reset password**.

**Rester connecté :** la case à cocher dans l'écran de connexion contrôle où la session est gardée — cochée (par défaut), elle survit à la fermeture du navigateur ; décochée, elle est oubliée à la fermeture de l'onglet.

## Lancer le projet en local

```bash
npm install   # seulement si node_modules n'existe pas encore
npm run dev
```

Puis ouvrir l'URL affichée dans le terminal (par défaut http://localhost:5173/).

Autres commandes :

```bash
npm run build     # build de production dans dist/
npm run preview   # sert le build de production en local
```

## Mettre l'app en ligne (GitHub Pages)

Le dépôt contient un workflow GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) qui build et déploie automatiquement l'app sur GitHub Pages à chaque `push` sur `main`. Deux réglages à faire une seule fois sur GitHub :

1. **Ajouter les clés Supabase en secrets** : sur le repo GitHub → **Settings → Secrets and variables → Actions → New repository secret**, crée :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (les mêmes valeurs que dans ton `.env` local — sans ça le build ne peut pas se connecter à Supabase).
2. **Activer Pages** : **Settings → Pages → Build and deployment → Source** → choisis **GitHub Actions**.

Après ça, chaque `push` sur `main` redéploie automatiquement. L'app sera accessible sur `https://OUSSKKL.github.io/suivi-de-cvc/`. Tu peux suivre la progression du déploiement dans l'onglet **Actions** du repo.

## Structure du projet

```
supabase/
  schema.sql                  schéma SQL complet (projet neuf)
  migration_auth.sql          migration : passage à l'authentification
  migration_user_scoped.sql   migration : isolation des données par compte
  migration_storage_policy.sql migration : retire la policy de lecture trop large sur le bucket photos
src/
  main.jsx               point d'entrée React
  App.jsx                 état global (session, liste des sites, navigation, toasts)
  index.css               styles globaux + Tailwind
  lib/                    accès aux données (supabaseClient.js, db.js), uid, format de date, téléchargement d'images
  data/                   constantes (marques/modèles de chaudières, mois)
  utils/                  helpers (tri des sites, statut des relevés)
  components/
    Login.jsx             écran de connexion (pas d'inscription)
    SetupNeeded.jsx        écran affiché si .env n'est pas configuré
    shared/               briques d'UI réutilisables (modales, états vides, etc.)
    sites/                liste des sites, fiche site, ajout/suppression
    compteurs/            onglet "Compteurs" (relevés) d'un site
    chaudieres/            onglet "Chaudières" d'un site (fiches, kits, photos plaque)
    photos/                onglet "Photos" d'un site
    tableaux/              vues de synthèse multi-sites (relevés, kits, chaudières)
```

Chaque dossier sous `components/` correspond à une fonctionnalité de l'app ; `shared/` regroupe les éléments d'UI génériques utilisés par plusieurs fonctionnalités. Toutes les requêtes vers Supabase passent par `src/lib/db.js`, qui est le seul endroit qui connaît la forme des tables.
