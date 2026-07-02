import { supabase } from "./supabaseClient";

// ---------- Détection admin ----------
// Le rôle est stocké dans app_metadata du compte (non modifiable côté client)
// et présent dans la session une fois connecté.
export function isAdmin(session) {
  return session?.user?.app_metadata?.role === "admin";
}

// ---------- Appels à l'Edge Function "admin" ----------
// L'Edge Function vérifie elle-même que l'appelant est admin.
async function callAdmin(action, params = {}) {
  const { data, error } = await supabase.functions.invoke("admin", {
    body: { action, ...params },
  });
  // supabase-js renvoie l'erreur HTTP dans `error` ; on essaie d'en extraire le
  // message métier renvoyé par la fonction.
  if (error) {
    let msg = error.message;
    try {
      const body = await error.context?.json?.();
      if (body?.error) msg = body.error;
    } catch {
      /* pas de corps JSON exploitable */
    }
    throw new Error(msg || "Erreur");
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export function listUsers() {
  return callAdmin("list").then((d) => d.users || []);
}
export function createUser(username, password) {
  return callAdmin("create", { username, password });
}
export function setUsername(userId, username) {
  return callAdmin("setUsername", { userId, username });
}
export function setUserPassword(userId, password) {
  return callAdmin("setPassword", { userId, password });
}
export function deleteUser(userId) {
  return callAdmin("delete", { userId });
}

// ---------- Affectations site ↔ technicien (via RLS, pas besoin d'Edge Fn) ----------
export async function listAssignments() {
  const { data, error } = await supabase.from("site_assignments").select("site_id, user_id");
  if (error) throw error;
  return data;
}
export async function assignSite(siteId, userId) {
  const { error } = await supabase.from("site_assignments").insert({ site_id: siteId, user_id: userId });
  if (error) throw error;
}
export async function unassignSite(siteId, userId) {
  const { error } = await supabase
    .from("site_assignments")
    .delete()
    .eq("site_id", siteId)
    .eq("user_id", userId);
  if (error) throw error;
}
