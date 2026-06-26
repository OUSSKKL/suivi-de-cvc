import { useState } from "react";
import { LogIn, Gauge } from "lucide-react";
import { supabase, usernameToEmail, setRememberMe } from "../lib/supabaseClient";

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
    <div className="min-h-screen bg-[#0c0e10] flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm border border-[#272d32] rounded-xl p-6 bg-[#15191c]"
      >
        <div className="flex items-center gap-2 text-[#ff8a3d] font-mono text-xs uppercase tracking-[0.18em] mb-1.5">
          <Gauge size={14} strokeWidth={2.5} />
          Suivi CVC multi-sites
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2 mb-4">
          <LogIn size={20} className="text-[#ff8a3d]" />
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
            className="w-4 h-4 rounded accent-[#ff8a3d]"
          />
          Rester connecté
        </label>
        {error && <p className="text-[#ff8a8a] text-sm mt-3">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-[#ff8a3d] hover:bg-[#ff9d5c] disabled:opacity-50 text-[#1a1006] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
