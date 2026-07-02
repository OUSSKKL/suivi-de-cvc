import { useState, useEffect, useMemo } from "react";
import { Shield, Users, MapPin, Plus, Trash2, Check, Search, X, LogOut, ChevronRight, Pencil, AlertTriangle } from "lucide-react";
import * as admin from "../../lib/admin";
import * as db from "../../lib/db";
import { setSiteCoord, removeSiteCoord } from "../../utils/siteLocations";
import AddSiteModal from "../sites/AddSiteModal";
import AdminMapPreview from "./AdminMapPreview";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";

// Palette de couleurs par technicien (attribuée dans l'ordre de la liste).
const TECH_COLORS = [
  "#2b7fff", "#f59e0b", "#10b981", "#a855f7", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

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
          { id: "affectations", label: "Sites", icon: MapPin },
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
        <ComptesTab showToast={showToast} />
      ) : (
        <SitesTab showToast={showToast} />
      )}
    </div>
  );
}

// ============================ Onglet Comptes ============================
function initials(name) {
  const s = (name || "").trim();
  return s.slice(0, 2).toUpperCase() || "?";
}

function ComptesTab({ showToast }) {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [manage, setManage] = useState(null); // compte en cours de gestion

  async function load() {
    setError("");
    try {
      const all = await admin.listUsers();
      // On n'affiche QUE les techniciens (pas les comptes admin).
      setUsers(all.filter((u) => !u.isAdmin));
    } catch (e) {
      setError(e.message);
      setUsers([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  // Une couleur par technicien (cohérente avec l'onglet Sites).
  const colorByUser = useMemo(() => {
    const m = {};
    (users || []).forEach((u, i) => (m[u.id] = TECH_COLORS[i % TECH_COLORS.length]));
    return m;
  }, [users]);

  return (
    <div>
      {/* En-tête : compteur + bouton créer */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <p className="text-[#c2c8cd] text-sm font-medium">
          {users === null ? "…" : `${users.length} technicien${users.length > 1 ? "s" : ""}`}
        </p>
        <button
          onClick={() => setCreating(true)}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          Nouveau compte
        </button>
      </div>

      {error && <p className="text-[#ff8a8a] text-sm mb-3">{error}</p>}

      {/* Grille de cartes techniciens */}
      {users === null ? (
        <p className="text-[#7d868d] text-sm">Chargement…</p>
      ) : users.length === 0 ? (
        <div className="border border-dashed border-[#272d32] rounded-xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#2b7fff]/10 flex items-center justify-center mx-auto mb-3">
            <Users size={22} className="text-[#2b7fff]/80" />
          </div>
          <p className="text-[#e4e7ea] font-medium mb-1">Aucun technicien</p>
          <p className="text-[#929ba2] text-sm">Crée un premier compte avec le bouton ci-dessus.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {users.map((u) => {
            const color = colorByUser[u.id];
            return (
              <button
                key={u.id}
                onClick={() => setManage(u)}
                className="group flex items-center gap-3 p-3 rounded-xl border border-[#272d32] bg-[#15191c] hover:border-[#3a4147] hover:-translate-y-0.5 hover:shadow-card transition-all text-left"
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ring-1"
                  style={{ background: `${color}1f`, color, borderColor: `${color}33`, boxShadow: `inset 0 0 0 1px ${color}33` }}
                >
                  {initials(u.username)}
                </span>
                <span className="min-w-0 flex-1 text-white text-sm font-semibold truncate">{u.username}</span>
                <ChevronRight size={16} className="text-[#7d868d] group-hover:text-[#c2c8cd] shrink-0 transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {creating && (
        <CreateUserModal
          onClose={() => setCreating(false)}
          onCreated={async () => {
            setCreating(false);
            showToast("Compte créé");
            await load();
          }}
        />
      )}
      {manage && (
        <ManageUserModal
          user={manage}
          onClose={() => setManage(null)}
          onChanged={async (msg) => {
            setManage(null);
            showToast(msg);
            await load();
          }}
        />
      )}
    </div>
  );
}

function CreateUserModal({ onClose, onCreated }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!username.trim() || password.length < 6) return;
    setBusy(true);
    setError("");
    try {
      await admin.createUser(username.trim(), password);
      onCreated();
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <ModalWrap title="Nouveau compte" onClose={onClose}>
      <form onSubmit={submit}>
        <label className="block text-[#c2c8cd] text-xs font-semibold mb-1.5">Nom d'utilisateur</label>
        <input
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="ex : moha"
          autoCapitalize="none"
          autoCorrect="off"
          className="modal-input w-full mb-3"
        />
        <label className="block text-[#c2c8cd] text-xs font-semibold mb-1.5">Mot de passe</label>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="6 caractères minimum"
          type="text"
          className="modal-input w-full"
        />
        {error && <p className="text-[#ff8a8a] text-sm mt-2">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button type="button" onClick={onClose} className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#15191c]">
            Annuler
          </button>
          <button type="submit" disabled={busy || !username.trim() || password.length < 6} className="btn-accent flex-1 font-semibold text-sm py-2.5 rounded-lg disabled:opacity-40">
            {busy ? "…" : "Créer"}
          </button>
        </div>
      </form>
    </ModalWrap>
  );
}

// Popup de gestion d'un technicien : renommer, changer le mot de passe, supprimer.
function ManageUserModal({ user, onClose, onChanged }) {
  const [name, setName] = useState(user.username);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  async function run(fn, successMsg) {
    setBusy(true);
    setError("");
    try {
      await fn();
      onChanged(successMsg);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  const nameChanged = name.trim() && name.trim() !== user.username;

  return (
    <ModalWrap title={user.username} onClose={onClose}>
      {error && <p className="text-[#ff8a8a] text-sm mb-3">{error}</p>}

      {/* Renommer */}
      <label className="block text-[#c2c8cd] text-xs font-semibold mb-1.5">Nom d'utilisateur</label>
      <div className="flex gap-2 mb-4">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off"
          className="modal-input flex-1"
        />
        <button
          onClick={() => run(() => admin.setUsername(user.id, name.trim()), "Nom modifié")}
          disabled={busy || !nameChanged}
          className="btn-accent font-semibold text-sm px-3.5 rounded-lg disabled:opacity-40 shrink-0"
        >
          OK
        </button>
      </div>

      {/* Mot de passe */}
      <label className="block text-[#c2c8cd] text-xs font-semibold mb-1.5">Nouveau mot de passe</label>
      <div className="flex gap-2 mb-5">
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="6 caractères min."
          type="text"
          className="modal-input flex-1"
        />
        <button
          onClick={() => run(() => admin.setUserPassword(user.id, pw), "Mot de passe modifié")}
          disabled={busy || pw.length < 6}
          className="btn-accent font-semibold text-sm px-3.5 rounded-lg disabled:opacity-40 shrink-0"
        >
          OK
        </button>
      </div>

      {/* Supprimer */}
      {!confirmDel ? (
        <button
          onClick={() => setConfirmDel(true)}
          disabled={busy}
          className="w-full flex items-center justify-center gap-1.5 border border-[#272d32] text-[#ef4444] hover:border-[#ef4444]/50 hover:bg-[#ef4444]/5 font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40"
        >
          <Trash2 size={15} />
          Supprimer le compte
        </button>
      ) : (
        <div className="border border-[#ef4444]/30 rounded-lg p-3">
          <p className="text-[#aab3ba] text-sm mb-3">
            Supprimer <span className="text-white font-semibold">{user.username}</span> définitivement ?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDel(false)}
              disabled={busy}
              className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2 rounded-lg hover:bg-[#15191c]"
            >
              Annuler
            </button>
            <button
              onClick={() => run(() => admin.deleteUser(user.id), "Compte supprimé")}
              disabled={busy}
              className="flex-1 bg-[#ef4444] text-white font-semibold text-sm py-2 rounded-lg hover:bg-[#dc2626] disabled:opacity-40"
            >
              {busy ? "…" : "Supprimer"}
            </button>
          </div>
        </div>
      )}
    </ModalWrap>
  );
}

// ============================== Onglet Sites ==============================
// Réservé à l'admin : ajouter des sites, les renommer (adresses réelles), et
// les affecter aux techniciens. "Tous" affiche l'ensemble des sites ; un
// technicien affiche seulement les siens.
function SitesTab({ showToast }) {
  const [sites, setSites] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lastBySite, setLastBySite] = useState({}); // siteId -> date du dernier relevé
  const [target, setTarget] = useState("all"); // "all" | userId
  const [allColorMode, setAllColorMode] = useState("tech"); // "tech" | "releve" (vue Tous)
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [manage, setManage] = useState(null); // site en cours de gestion
  const [pendingAdd, setPendingAdd] = useState(null); // doublon en attente de confirmation

  async function load() {
    setError("");
    try {
      const [s, u, a, releves] = await Promise.all([
        db.listSites(),
        admin.listUsers(),
        admin.listAssignments(),
        db.listAllReleves(),
      ]);
      setSites(s);
      setUsers(u.filter((x) => !x.isAdmin));
      setAssignments(a);
      const last = {};
      for (const r of releves) if (!last[r.siteId] || r.date > last[r.siteId]) last[r.siteId] = r.date;
      setLastBySite(last);
    } catch (e) {
      setError(e.message);
      setSites([]);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const countByUser = useMemo(() => {
    const m = {};
    for (const a of assignments) m[a.user_id] = (m[a.user_id] || 0) + 1;
    return m;
  }, [assignments]);

  // Une couleur par technicien (dans l'ordre de la liste).
  const colorByUser = useMemo(() => {
    const m = {};
    users.forEach((u, i) => (m[u.id] = TECH_COLORS[i % TECH_COLORS.length]));
    return m;
  }, [users]);

  // Techniciens affectés à chaque site (pour les pastilles de couleur).
  const techsBySite = useMemo(() => {
    const m = {};
    for (const a of assignments) (m[a.site_id] = m[a.site_id] || []).push(a.user_id);
    return m;
  }, [assignments]);

  // Détection des doublons : combien de sites portent chaque nom (normalisé).
  const nameCounts = useMemo(() => {
    const m = {};
    for (const s of sites || []) {
      const k = s.name.trim().toUpperCase();
      m[k] = (m[k] || 0) + 1;
    }
    return m;
  }, [sites]);
  const isDup = (name) => (nameCounts[name.trim().toUpperCase()] || 0) > 1;
  const dupGroups = useMemo(() => Object.values(nameCounts).filter((n) => n > 1).length, [nameCounts]);

  const assignedForTarget = useMemo(() => {
    const set = new Set();
    if (target !== "all") for (const a of assignments) if (a.user_id === target) set.add(a.site_id);
    return set;
  }, [assignments, target]);

  const visibleSites = useMemo(() => {
    let list = [...(sites || [])].sort((a, b) => a.name.localeCompare(b.name));
    if (target !== "all") list = list.filter((s) => assignedForTarget.has(s.id));
    const q = search.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, target, assignedForTarget, search]);

  // Points géolocalisés du filtre courant.
  //  - "Tous" : coloré par technicien (pour distinguer qui gère quoi).
  //  - un technicien : coloré par statut de relevé (vert/orange/rouge), comme
  //    la carte que voit ce technicien.
  const mapPoints = useMemo(() => {
    const pts = [];
    for (const s of visibleSites) {
      if (s.lat == null || s.lng == null) continue;
      let color;
      if (target === "all" && allColorMode === "tech") {
        const uid = techsBySite[s.id]?.[0];
        color = uid ? colorByUser[uid] : "#7d868d";
      } else {
        // Vue technicien (toujours) ou "Tous" en mode relevé → couleur de statut.
        color = STATUS_COLORS[releveStatus(lastBySite[s.id])];
      }
      pts.push({ lat: s.lat, lng: s.lng, color, name: s.name, last: lastBySite[s.id] || null });
    }
    return pts;
  }, [visibleSites, techsBySite, colorByUser, target, allColorMode, lastBySite]);

  // Crée réellement le site (après contrôle de doublon).
  async function createNow(clean, coords) {
    try {
      const site = await db.createSite(clean, "", coords);
      if (coords) setSiteCoord(clean, coords);
      if (target !== "all") await admin.assignSite(site.id, target);
      showToast("Site ajouté");
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAdd(name, coords) {
    const clean = name.trim().toUpperCase();
    setAdding(false);
    // Si un site du même nom existe déjà → on demande confirmation.
    if ((nameCounts[clean] || 0) > 0) {
      setPendingAdd({ name: clean, coords });
      return;
    }
    await createNow(clean, coords);
  }

  if (sites === null) return <p className="text-[#7d868d] text-sm">Chargement…</p>;

  const targetName = target === "all" ? "Tous" : users.find((u) => u.id === target)?.username;

  return (
    <div>
      {error && <p className="text-[#ff8a8a] text-sm mb-3">{error}</p>}

      {/* Sélecteur : Tous + techniciens */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Chip label="Tous" count={sites.length} active={target === "all"} onClick={() => setTarget("all")} />
        {users.map((u) => (
          <Chip
            key={u.id}
            label={u.username}
            count={countByUser[u.id] || 0}
            color={colorByUser[u.id]}
            active={target === u.id}
            onClick={() => setTarget(u.id)}
          />
        ))}
      </div>

      {/* Aperçu carte : bascule couleur seulement sur "Tous" ; un technicien
          est toujours affiché par statut de relevé. */}
      <AdminMapPreview
        points={mapPoints}
        colorMode={allColorMode}
        onColorMode={target === "all" ? setAllColorMode : null}
      />

      {/* Ajouter un site */}
      <button
        onClick={() => setAdding(true)}
        className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg mb-4"
      >
        <Plus size={16} strokeWidth={2.5} />
        Ajouter un site{target !== "all" ? ` pour ${targetName}` : ""}
      </button>

      {/* Alerte doublons */}
      {dupGroups > 0 && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#f59e0b] text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          {dupGroups} doublon{dupGroups > 1 ? "s" : ""} dans la liste (même adresse en plusieurs exemplaires).
        </div>
      )}

      {/* Recherche */}
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
        {visibleSites.length} site(s){target !== "all" ? " affecté(s)" : ""} · touche un site pour le gérer
      </p>

      {/* Liste des sites */}
      <div className="border border-[#272d32] rounded-xl overflow-hidden">
        {visibleSites.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setManage(s)}
            style={{ borderLeft: `4px solid ${techsBySite[s.id]?.length ? colorByUser[techsBySite[s.id][0]] : "transparent"}` }}
            className={`w-full flex items-center gap-3 pl-3 pr-4 py-3.5 text-left hover:bg-[#15191c] transition-colors ${
              i !== visibleSites.length - 1 ? "border-b border-[#272d32]" : ""
            }`}
          >
            <MapPin
              size={15}
              className={`shrink-0 ${s.lat != null ? "text-[#2b7fff]" : "text-[#4a5157]"}`}
            />
            <span className="min-w-0 flex-1 text-white text-sm font-medium truncate">{s.name}</span>
            {isDup(s.name) && (
              <span className="flex items-center gap-1 shrink-0 text-[10px] font-bold uppercase tracking-wide text-[#f59e0b] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded">
                <AlertTriangle size={11} />
                doublon
              </span>
            )}
            {/* Si plusieurs techniciens : pastilles des autres couleurs. */}
            {(techsBySite[s.id] || []).length > 1 && (
              <span className="flex items-center gap-1 shrink-0">
                {techsBySite[s.id].slice(1).map((uid) => (
                  <span
                    key={uid}
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: colorByUser[uid] || "#4a5157" }}
                    title={users.find((u) => u.id === uid)?.username}
                  />
                ))}
              </span>
            )}
            <ChevronRight size={16} className="text-[#7d868d] shrink-0" />
          </button>
        ))}
        {visibleSites.length === 0 && <p className="text-[#7d868d] text-sm px-4 py-3">Aucun site.</p>}
      </div>

      {adding && <AddSiteModal withLocation onCancel={() => setAdding(false)} onSave={handleAdd} />}
      {pendingAdd && (
        <ModalWrap title="Site en doublon" onClose={() => setPendingAdd(null)}>
          <div className="flex items-start gap-2.5 mb-4">
            <AlertTriangle size={18} className="text-[#f59e0b] shrink-0 mt-0.5" />
            <p className="text-[#aab3ba] text-sm">
              Un site nommé <span className="text-white font-semibold">{pendingAdd.name}</span> existe
              déjà. L'ajouter quand même ?
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingAdd(null)}
              className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#15191c]"
            >
              Annuler
            </button>
            <button
              onClick={async () => {
                const p = pendingAdd;
                setPendingAdd(null);
                await createNow(p.name, p.coords);
              }}
              className="btn-accent flex-1 font-semibold text-sm py-2.5 rounded-lg"
            >
              Ajouter quand même
            </button>
          </div>
        </ModalWrap>
      )}
      {manage && (
        <SiteAdminModal
          site={manage}
          users={users}
          assignments={assignments}
          colorByUser={colorByUser}
          onClose={() => setManage(null)}
          onChanged={async (msg, close) => {
            showToast(msg);
            await load();
            if (close) setManage(null);
          }}
        />
      )}
    </div>
  );
}

function Chip({ label, count, active, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
        active ? "bg-[#2b7fff]/10 border-[#2b7fff]/30 text-[#2b7fff]" : "border-[#272d32] text-[#c2c8cd] hover:bg-[#15191c]"
      }`}
    >
      {color && <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />}
      {label}
      <span className="text-[#7d868d] tabular-nums">{count}</span>
    </button>
  );
}

// Popup de gestion d'un site : renommer (adresses réelles + carte) et affecter
// aux techniciens.
function SiteAdminModal({ site, users, assignments, colorByUser = {}, onClose, onChanged }) {
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

  const assignedSet = useMemo(
    () => new Set(assignments.filter((a) => a.site_id === site.id).map((a) => a.user_id)),
    [assignments, site.id]
  );

  async function toggle(userId) {
    setBusy(true);
    setError("");
    try {
      if (assignedSet.has(userId)) await admin.unassignSite(site.id, userId);
      else await admin.assignSite(site.id, userId);
      onChanged("Affectation mise à jour", false);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  async function handleRename(name, coords) {
    const clean = name.trim().toUpperCase();
    const oldName = site.name;
    try {
      await db.updateSiteName(site.id, clean);
      if (coords) {
        await db.updateSiteCoord(site.id, coords);
        setSiteCoord(clean, coords);
      }
      if (oldName !== clean) removeSiteCoord(oldName);
      onChanged("Site renommé", true);
    } catch (e) {
      setError(e.message);
      setRenaming(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    setError("");
    try {
      await db.deleteSite(site.id);
      removeSiteCoord(site.name);
      onChanged("Site supprimé", true);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  if (renaming) {
    return <AddSiteModal withLocation item={site} onCancel={() => setRenaming(false)} onSave={handleRename} />;
  }

  return (
    <ModalWrap title={site.name} onClose={onClose}>
      {error && <p className="text-[#ff8a8a] text-sm mb-3">{error}</p>}

      <button
        onClick={() => setRenaming(true)}
        className="w-full flex items-center justify-center gap-1.5 border border-[#272d32] hover:border-[#2b7fff]/40 text-[#c2c8cd] hover:text-white font-semibold text-sm py-2.5 rounded-lg transition-colors mb-4"
      >
        <Pencil size={15} />
        Renommer l'adresse
      </button>

      <p className="text-[#c2c8cd] text-xs font-semibold mb-2">Affecté aux techniciens</p>
      {users.length === 0 ? (
        <p className="text-[#7d868d] text-sm">Aucun technicien.</p>
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {users.map((u, i) => {
            const on = assignedSet.has(u.id);
            return (
              <button
                key={u.id}
                onClick={() => toggle(u.id)}
                disabled={busy}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors disabled:opacity-60 ${
                  i !== users.length - 1 ? "border-b border-[#272d32]" : ""
                } ${on ? "bg-[#2b7fff]/5" : "hover:bg-[#15191c]"}`}
              >
                <span
                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                    on ? "bg-[#2b7fff] border-[#2b7fff]" : "border-[#3a4147]"
                  }`}
                >
                  {on && <Check size={13} className="text-white" strokeWidth={3} />}
                </span>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colorByUser[u.id] || "#4a5157" }} />
                <span className="text-white text-sm font-medium truncate">{u.username}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Supprimer le site */}
      <div className="mt-5 pt-4 border-t border-[#272d32]">
        {!confirmDel ? (
          <button
            onClick={() => setConfirmDel(true)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-1.5 border border-[#272d32] text-[#ef4444] hover:border-[#ef4444]/50 hover:bg-[#ef4444]/5 font-semibold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-40"
          >
            <Trash2 size={15} />
            Supprimer le site
          </button>
        ) : (
          <div className="border border-[#ef4444]/30 rounded-lg p-3">
            <p className="text-[#aab3ba] text-sm mb-3">
              Supprimer <span className="text-white font-semibold">{site.name}</span> et toutes ses
              données (relevés, chaudières, photos) définitivement ?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDel(false)}
                disabled={busy}
                className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2 rounded-lg hover:bg-[#15191c]"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="flex-1 bg-[#ef4444] text-white font-semibold text-sm py-2 rounded-lg hover:bg-[#dc2626] disabled:opacity-40"
              >
                {busy ? "…" : "Supprimer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalWrap>
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
