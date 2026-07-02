# Déploiement de l'Admin — pas à pas

Tout se fait dans le **dashboard Supabase** (aucun outil à installer). Suis les
étapes dans l'ordre.

---

## Étape 1 — Créer les tables et les règles d'accès (SQL)

1. Dashboard Supabase → menu de gauche → **SQL Editor** → **New query**.
2. Ouvre le fichier `supabase/admin_setup.sql`, copie **tout** son contenu, colle-le.
3. Clique **Run**. Ça doit finir sans erreur (« Success »).

> Ce script crée les tables `profiles` et `site_assignments`, et met en place
> les règles : chaque technicien ne verra QUE ses sites affectés ; l'admin voit
> tout.

---

## Étape 2 — Créer le compte admin (séparé de ton compte principal)

1. Dashboard → **Authentication** → **Users** → **Add user**.
2. Email : `admin@suivi-cvc.app` — Mot de passe : celui que tu veux — coche
   **Auto Confirm User**. Valide.
3. Retourne dans **SQL Editor**, nouvelle requête, colle et **Run** :

```sql
update auth.users
   set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'
 where email = 'admin@suivi-cvc.app';

update public.profiles set is_admin = true
 where id = (select id from auth.users where email = 'admin@suivi-cvc.app');
```

> Le nom d'utilisateur pour se connecter sera **admin** (partie avant `@`).

---

## Étape 3 — Déployer l'Edge Function (gestion des comptes)

L'onglet « Comptes » a besoin d'une fonction serveur qui garde la clé admin en
sécurité.

1. Dashboard → **Edge Functions** → **Create a new function**.
2. Nom **exact** : `admin`.
3. Dans l'éditeur en ligne, efface le contenu par défaut, puis colle **tout** le
   contenu de `supabase/functions/admin/index.ts`.
4. **Deploy**.

### Variables d'environnement (secrets)

La fonction a besoin de 3 valeurs. Les deux `SUPABASE_URL` et
`SUPABASE_SERVICE_ROLE_KEY` sont souvent déjà fournies automatiquement ; ajoute
celles qui manquent :

Dashboard → **Edge Functions** → onglet **Secrets** (ou **Settings**) :

| Nom                         | Où le trouver                                              |
| --------------------------- | --------------------------------------------------------- |
| `SUPABASE_URL`              | Settings → API → Project URL                              |
| `SUPABASE_ANON_KEY`         | Settings → API → Project API keys → **anon public**       |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → **service_role** ⚠️   |

> ⚠️ La clé **service_role** est ultra-sensible : elle ne va QUE ici (côté
> serveur), jamais dans l'app / le code du site.

---

## Étape 4 — Tester

1. Le site se met à jour tout seul après le `git push` (déjà fait par Claude).
2. Connecte-toi avec le compte **admin**. Une icône bouclier 🛡️ apparaît en haut
   à droite → c'est le panneau **Administration**.
3. Onglet **Comptes** : crée un compte technicien, change un mot de passe, etc.
4. Onglet **Sites par tech** : choisis un technicien, coche les sites qu'il doit
   voir.
5. Connecte-toi avec ce technicien : il ne voit QUE ses sites affectés. 👍

---

## Notes

- **Ton compte principal** n'est PAS admin : il devient un technicien normal (il
  ne verra que les sites qui lui sont affectés). Si tu veux qu'il voie tout,
  soit tu te l'affectes tous les sites depuis l'admin, soit tu le passes admin
  aussi (même commande SQL qu'à l'étape 2 avec son email).
- Un technicien qui **crée** un site se le voit affecter automatiquement.
- Si l'app dit « non admin » alors que tu viens de te promouvoir : **déconnecte
  puis reconnecte-toi** (le rôle est chargé à la connexion).
