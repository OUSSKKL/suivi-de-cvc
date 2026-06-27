import { useState } from "react";
import { LogIn, Gauge } from "lucide-react";
import { supabase, usernameToEmail, setRememberMe } from "../lib/supabaseClient";
import Logo from "./shared/Logo";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setRememberMe(remember);
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });
    setLoading(false);
    if (error) setError("Identifiant ou mot de passe incorrect");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-[#272d32] rounded-2xl p-6 bg-surface-gradient shadow-lift animate-scale-in"
      >
        <div className="mb-4">
          <Logo size={52} />
        </div>
        <div className="flex items-center gap-2 text-[#2b7fff] font-mono text-xs uppercase tracking-[0.18em] mb-1.5">
          <Gauge size={14} strokeWidth={2.5} />
          Suivi CVC multi-sites
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2 mb-4">
          <LogIn size={20} className="text-[#2b7fff]" />
          Connexion
        </h1>
        <div className="space-y-3">
          <input
            type="text"
            autoFocus
            required
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Nom d'utilisateur"
            className="modal-input"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="modal-input"
          />
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm text-[#c2c8cd] select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="w-4 h-4 rounded accent-[#2b7fff]"
          />
          Rester connecté
        </label>
        {error && <p className="text-[#ff8a8a] text-sm mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="btn-accent w-full mt-4 font-semibold text-sm px-4 py-2.5 rounded-lg"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
