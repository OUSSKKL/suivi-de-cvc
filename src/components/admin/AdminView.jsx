import { useState, useEffect, useMemo } from "react";
import { Shield, Users, MapPin, Plus, Trash2, KeyRound, Check, Search, X, LogOut } from "lucide-react";
import * as admin from "../../lib/admin";

export default function AdminView({ sites, currentUserId, onLogout, showToast }) {
  const [tab, setTab] = useState("comptes"); // comptes | affectations

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
            <Shield size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white truncate">Administration</h1>
        </div>
        <button
          onClick={onLogout}
          className="shrink-0 flex items-center gap-1.5 text-[#c2c8cd] hover:text-white border border-[#272d32] hover:border-[#3a4147] text-sm font-medium px-3 py-2 rounded-lg transition-colors"
          title="Se déconnecter"
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[
          { id: "comptes", label: "Comptes", icon: Users },
          { id: "affectations", label: "Sites par tech", icon: MapPin },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border transition-colors ${
              tab === id
                ? "bg-[#2b7fff]/10 border-[#2b7fff]/30 text-[#2b7fff]"
                : "border-[#272d32] text-[#c2c8cd] hover:bg-[#15191c]"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {tab === "comptes" ? (
        <ComptesTab currentUserId={currentUserId} showToast={showToast} />
      ) : (
        <AffectationsTab sites={sites} currentUserId={currentUserId} showToast={showToast} />
      )}
    </div>
  );
}

// ============================ Onglet Comptes ============================
function ComptesTab({ currentUserId, showToast }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Formulaire création
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");

  // Modales
  const [pwFor, setPwFor] = useState(null); // { id, username }
  const [delFor, setDelFor] = useState(null); // { id, username }

  async function load() {
    setError("");
    try {
      setUsers(await admin.listUsers());
    } catch (e) {
      setError(e.message);
      setUsers([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!newUser.trim() || !newPass) return;
    setBusy(true);
    setError("");
    try {
      await admin.createUser(newUser.trim(), newPass);
      setNewUser("");
      setNewPass("");
      showToast("Compte créé");
      await load();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  return (
    <div>
      {/* Création */}
      <form onSubmit={handleCreate} className="border border-[#272d32] rounded-xl bg-[#15191c] p-4 mb-5">
        <p className="text-white text-sm font-bold mb-3">Nouveau compte</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input
            value={newUser}
            onChange={(e) => setNewUser(e.target.value)}
            placeholder="Nom d'utilisateur"
            autoCapitalize="none"
            autoCorrect="off"
            className="modal-input"
          />
          <input
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            placeholder="Mot de passe (6 min.)"
            type="text"
            className="modal-input"
          />
        </div>
        <button
          type="submit"
          disabled={busy || !newUser.trim() || newPass.length < 6}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg mt-3 disabled:opacity-40"
        >
          <Plus size={16} strokeWidth={2.5} />
          Créer le compte
        </button>
      </form>

      {error && <p className="text-[#ff8a8a] text-sm mb-3">{error}</p>}

      {/* Liste */}
      {users === null ? (
        <p className="text-[#7d868d] text-sm">Chargement…</p>
      ) : users.length === 0 ? (
        <p className="text-[#7d868d] text-sm">Aucun compte.</p>
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-3 px-4 py-3 ${i !== users.length - 1 ? "border-b border-[#272d32]" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-white text-sm font-semibold flex items-center gap-2">
                  {u.username}
                  {u.isAdmin && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[#2b7fff] bg-[#2b7fff]/10 px-1.5 py-0.5 rounded">
                      admin
                    </span>
                  )}
                </p>
              </div>
              {!u.isAdmin && (
                <button
                  onClick={() => setPwFor(u)}
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[#272d32] hover:border-[#3a4147] text-[#c2c8cd] hover:text-white transition-colors"
                  title="Changer le mot de passe"
                >
                  <KeyRound size={15} />
                </button>
              )}
              {u.id !== currentUserId && !u.isAdmin && (
                <button
                  onClick={() => setDelFor(u)}
                  className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border border-[#272d32] hover:border-[#ef4444]/50 text-[#c2c8cd] hover:text-[#ef4444] transition-colors"
                  title="Supprimer le compte"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {pwFor && (
        <PasswordModal
          user={pwFor}
          onClose={() => setPwFor(null)}
          onDone={() => {
            setPwFor(null);
            showToast("Mot de passe modifié");
          }}
        />
      )}
      {delFor && (
        <DeleteModal
          user={delFor}
          onClose={() => setDelFor(null)}
          onDone={async () => {
            setDelFor(null);
            showToast("Compte supprimé");
            await load();
          }}
        />
      )}
    </div>
  );
}

function PasswordModal({ user, onClose, onDone }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await admin.setUserPassword(user.id, pw);
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <ModalWrap title={`Mot de passe — ${user.username}`} onClose={onClose}>
      <form onSubmit={submit}>
        <input
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Nouveau mot de passe (6 min.)"
          type="text"
          className="modal-input w-full"
        />
        {error && <p className="text-[#ff8a8a] text-sm mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#15191c]">
            Annuler
          </button>
          <button type="submit" disabled={busy || pw.length < 6} className="btn-accent flex-1 font-semibold text-sm py-2.5 rounded-lg disabled:opacity-40">
            {busy ? "…" : "Enregistrer"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

function DeleteModal({ user, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await admin.deleteUser(user.id);
      onDone();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <ModalWrap title="Supprimer ce compte ?" onClose={onClose}>
      <p className="text-[#aab3ba] text-sm mb-1">
        Le compte <span className="text-white font-semibold">{user.username}</span> sera supprimé
        définitivement. Ses affectations de sites seront retirées.
      </p>
      {error && <p className="text-[#ff8a8a] text-sm mt-2">{error}</p>}
      <div className="flex gap-2 mt-4">
        <button onClick={onClose} className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#15191c]">
          Annuler
        </button>
        <button
          onClick={confirm}
          disabled={busy}
          className="flex-1 bg-[#ef4444] text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-[#dc2626] disabled:opacity-40"
        >
          {busy ? "…" : "Supprimer"}
        </button>
      </div>
    </ModalWrap>
  );
}

// ========================= Onglet Affectations =========================
function AffectationsTab({ sites, currentUserId, showToast }) {
  const [users, setUsers] = useState(null);
  const [assignments, setAssignments] = useState(null); // [{site_id, user_id}]
  const [selectedUser, setSelectedUser] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [u, a] = await Promise.all([admin.listUsers(), admin.listAssignments()]);
      setUsers(u);
      setAssignments(a);
    } catch (e) {
      setError(e.message);
      setUsers([]);
      setAssignments([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const assignedSet = useMemo(() => {
    const s = new Set();
    if (assignments && selectedUser) {
      for (const a of assignments) if (a.user_id === selectedUser) s.add(a.site_id);
    }
    return s;
  }, [assignments, selectedUser]);

  const countByUser = useMemo(() => {
    const m = {};
    for (const a of assignments || []) m[a.user_id] = (m[a.user_id] || 0) + 1;
    return m;
  }, [assignments]);

  async function toggle(siteId) {
    if (!selectedUser) return;
    const isOn = assignedSet.has(siteId);
    // maj optimiste
    setAssignments((prev) =>
      isOn
        ? prev.filter((a) => !(a.site_id === siteId && a.user_id === selectedUser))
        : [...prev, { site_id: siteId, user_id: selectedUser }]
    );
    try {
      if (isOn) await admin.unassignSite(siteId, selectedUser);
      else await admin.assignSite(siteId, selectedUser);
    } catch (e) {
      setError(e.message);
      await load(); // resynchronise en cas d'échec
    }
  }

  const sortedSites = useMemo(
    () => [...(sites || [])].sort((a, b) => a.name.localeCompare(b.name)),
    [sites]
  );
  const filtered = sortedSites.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));

  if (error) return <p className="text-[#ff8a8a] text-sm">{error}</p>;
  if (users === null) return <p className="text-[#7d868d] text-sm">Chargement…</p>;

  return (
    <div>
      {/* Choix du technicien */}
      <p className="text-white text-sm font-bold mb-2">Technicien</p>
      <div className="flex flex-wrap gap-2 mb-5">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => setSelectedUser(u.id)}
            className={`text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              selectedUser === u.id
                ? "bg-[#2b7fff]/10 border-[#2b7fff]/30 text-[#2b7fff]"
                : "border-[#272d32] text-[#c2c8cd] hover:bg-[#15191c]"
            }`}
          >
            {u.username}
            <span className="ml-1.5 text-[#7d868d] tabular-nums">{countByUser[u.id] || 0}</span>
          </button>
        ))}
      </div>

      {!selectedUser ? (
        <p className="text-[#7d868d] text-sm">Choisis un technicien pour gérer ses sites.</p>
      ) : (
        <>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d868d]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un site…"
              className="w-full bg-[#15191c] border border-[#272d32] rounded-lg pl-9 pr-3 py-2.5 text-base placeholder-[#7d868d] text-white focus:border-[#2b7fff] focus:outline-none"
            />
          </div>
          <p className="text-[11px] text-[#7d868d] mb-2">
            {assignedSet.size} site(s) affecté(s) · touche un site pour l'ajouter/retirer
          </p>
          <div className="border border-[#272d32] rounded-xl overflow-hidden">
            {filtered.map((s, i) => {
              const on = assignedSet.has(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggle(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    i !== filtered.length - 1 ? "border-b border-[#272d32]" : ""
                  } ${on ? "bg-[#2b7fff]/5" : "hover:bg-[#15191c]"}`}
                >
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                      on ? "bg-[#2b7fff] border-[#2b7fff]" : "border-[#3a4147]"
                    }`}
                  >
                    {on && <Check size={13} className="text-white" strokeWidth={3} />}
                  </span>
                  <span className="text-white text-sm font-medium truncate">{s.name}</span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="text-[#7d868d] text-sm px-4 py-3">Aucun site.</p>}
          </div>
        </>
      )}
    </div>
  );
}

// ============================ Modale générique ============================
function ModalWrap({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm border border-[#272d32] rounded-2xl bg-surface-gradient p-5 shadow-lift animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <h2 className="text-white font-bold text-base">{title}</h2>
          <button onClick={onClose} className="text-[#7d868d] hover:text-white shrink-0">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
