// ============================================================================
//  Edge Function "admin" — gestion des comptes (réservée à l'admin)
// ----------------------------------------------------------------------------
//  Cette fonction tourne côté SERVEUR Supabase. Elle est la SEULE à détenir la
//  clé service_role (jamais exposée au navigateur). Elle vérifie que l'appelant
//  est bien admin (via son JWT) avant toute opération.
//
//  Actions (POST JSON { action, ... }) :
//   - "list"            → liste des comptes (id, username)
//   - "create"          → { username, password }        crée un compte tech
//   - "setPassword"     → { userId, password }           change un mot de passe
//   - "delete"          → { userId }                     supprime un compte
//
//  Déploiement : voir supabase/DEPLOY_ADMIN.md
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AUTH_EMAIL_DOMAIN = "suivi-cvc.app";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function usernameToEmail(username: string) {
  return `${username.trim().toLowerCase().replace(/\s+/g, "")}@${AUTH_EMAIL_DOMAIN}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Méthode non autorisée" }, 405);

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // 1) Vérifie que l'appelant est authentifié ET admin.
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) return json({ error: "Non authentifié" }, 401);

  const asCaller = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await asCaller.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: "Non authentifié" }, 401);

  const role = (userData.user.app_metadata as Record<string, unknown>)?.role;
  if (role !== "admin") return json({ error: "Accès refusé (non admin)" }, 403);

  // 2) Client admin (service_role) pour les opérations sensibles.
  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let payload: Record<string, string>;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400);
  }
  const action = payload.action;

  try {
    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) throw error;
      const users = data.users
        .map((u) => ({
          id: u.id,
          username: (u.email || "").split("@")[0],
          isAdmin: (u.app_metadata as Record<string, unknown>)?.role === "admin",
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      return json({ users });
    }

    if (action === "create") {
      const { username, password } = payload;
      if (!username || !password) return json({ error: "Nom d'utilisateur et mot de passe requis" }, 400);
      if (password.length < 6) return json({ error: "Mot de passe : 6 caractères minimum" }, 400);
      const { data, error } = await admin.auth.admin.createUser({
        email: usernameToEmail(username),
        password,
        email_confirm: true,
      });
      if (error) throw error;
      return json({ id: data.user.id, username });
    }

    if (action === "setUsername") {
      const { userId, username } = payload;
      if (!userId || !username) return json({ error: "Utilisateur et nom requis" }, 400);
      const email = usernameToEmail(username);
      const { error } = await admin.auth.admin.updateUserById(userId, { email, email_confirm: true });
      if (error) throw error;
      await admin.from("profiles").update({ username }).eq("id", userId);
      return json({ ok: true });
    }

    if (action === "setPassword") {
      const { userId, password } = payload;
      if (!userId || !password) return json({ error: "Utilisateur et mot de passe requis" }, 400);
      if (password.length < 6) return json({ error: "Mot de passe : 6 caractères minimum" }, 400);
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    if (action === "delete") {
      const { userId } = payload;
      if (!userId) return json({ error: "Utilisateur requis" }, 400);
      if (userId === userData.user.id) return json({ error: "Impossible de supprimer son propre compte" }, 400);
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: "Action inconnue" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message || "Erreur serveur" }, 500);
  }
});
