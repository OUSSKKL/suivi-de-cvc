import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

// Supabase Auth s'appuie sur un email, mais l'app n'en demande pas à
// l'utilisateur : on lui fait juste saisir un nom d'utilisateur, qu'on
// transforme ici en un email "factice" stable. Le compte doit être créé
// dans le dashboard Supabase avec exactement cet email (voir le README).
const AUTH_EMAIL_DOMAIN = "suivi-cvc.app";

export function usernameToEmail(username) {
  return `${username.trim().toLowerCase().replace(/\s+/g, "")}@${AUTH_EMAIL_DOMAIN}`;
}

// "Rester connecté" : si activé (par défaut), la session est gardée dans
// localStorage et survit à la fermeture du navigateur. Sinon, elle va dans
// sessionStorage et est perdue à la fermeture de l'onglet/navigateur.
const REMEMBER_KEY = "cvc:remember-me";

export function setRememberMe(remember) {
  window.localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
}

function rememberMe() {
  return window.localStorage.getItem(REMEMBER_KEY) !== "0";
}

const hybridStorage = {
  getItem: (key) => (rememberMe() ? window.localStorage.getItem(key) : window.sessionStorage.getItem(key)),
  setItem: (key, value) => (rememberMe() ? window.localStorage : window.sessionStorage).setItem(key, value),
  removeItem: (key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, { auth: { storage: hybridStorage } })
  : null;
