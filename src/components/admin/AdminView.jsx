import { useState, useEffect, useMemo, useRef } from "react";
import { Shield, Users, MapPin, Plus, Trash2, Check, Search, X, LogOut, ChevronRight, ChevronDown, Pencil, AlertTriangle, Info } from "lucide-react";
import * as admin from "../../lib/admin";
import * as db from "../../lib/db";
import { setSiteCoord, removeSiteCoord } from "../../utils/siteLocations";
import { groupSitesByClient, compareClients, CLIENT_ORDER } from "../../utils/sortSites";
import AddSiteModal from "../sites/AddSiteModal";
import AdminMapPreview from "./AdminMapPreview";
import ClientLogo from "../shared/ClientLogo";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";

// Palette de couleurs par technicien (attribuée dans l'ordre de la liste).
const TECH_COLORS = [
  "#2b7fff", "#f59e0b", "#10b981", "#a855f7", "#ef4444",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

export default function AdminView({ sites, currentUserId, onLogout, showToast, onOpenSite }) {
  // Onglet gardé pour la session : en revenant d'une fiche site, on retrouve "Sites".
  const [tab, setTabState] = useState(() => {
    try {
      return sessionStorage.getItem("cvc:adminTab") || "comptes";
    } catch {
      return "comptes";
    }
  }); // comptes | affectations
  function setTab(t) {
    setTabState(t);
    try {
      sessionStorage.setItem("cvc:adminTab", t);
    } catch {
      /* stockage indisponible */
    }
  }

  return (
    <div className="max-w-3xl lg:max-w-[1400px] mx-auto px-4 lg:px-8 pb-28 pt-6 animate-fade-in">
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
        <SitesTab showToast={showToast} onOpenSite={onOpenSite} />
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
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
function SitesTab({ showToast, onOpenSite }) {
  const [sites, setSites] = useState(null);
  const [users, setUsers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [lastBySite, setLastBySite] = useState({}); // siteId -> date du dernier relevé
  const [target, setTargetState] = useState(() => {
    try {
      return sessionStorage.getItem("cvc:adminTarget") || "all";
    } catch {
      return "all";
    }
  }); // "all" | userId
  function setTarget(t) {
    setTargetState(t);
    try {
      sessionStorage.setItem("cvc:adminTarget", t);
    } catch {
      /* stockage indisponible */
    }
  }
  const [allColorMode, setAllColorMode] = useState("tech"); // "tech" | "releve" (vue Tous)
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [manage, setManage] = useState(null); // site en cours de gestion
  const [pendingAdd, setPendingAdd] = useState(null); // doublon en attente de confirmation
  const [selected, setSelected] = useState(() => new Set()); // sites cochés (vue technicien)
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [assignTo, setAssignTo] = useState(""); // technicien choisi pour l'attribution groupée
  // PC : position de départ de la carte. Elle reste collée à cette hauteur
  // pendant qu'on fait défiler la liste (elle ne bouge pas à l'écran).
  const gridRef = useRef(null);
  const [mapTop, setMapTop] = useState(16);
  const sitesLoaded = sites !== null;
  useEffect(() => {
    function measure() {
      if (!gridRef.current) return;
      setMapTop(Math.max(16, Math.round(gridRef.current.getBoundingClientRect().top + window.scrollY)));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [sitesLoaded]);
  // Clients dépliés dans la liste (gardé pour la session).
  const [openClients, setOpenClients] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem("cvc:adminOpenClients") || "[]"));
    } catch {
      return new Set();
    }
  });
  function toggleClient(key) {
    setOpenClients((prev) => {
      // Un seul client ouvert à la fois : ouvrir un client ferme les autres.
      const n = prev.has(key) ? new Set() : new Set([key]);
      try {
        sessionStorage.setItem("cvc:adminOpenClients", JSON.stringify([...n]));
      } catch {
        /* stockage indisponible : tant pis */
      }
      return n;
    });
  }

  // On vide la sélection quand on change de technicien.
  useEffect(() => {
    setSelected(new Set());
    setConfirmRemove(false);
  }, [target]);

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
    // Tri par client (RIVP, CDC, 1001 VIES, ELOGIE…, sans client à la fin), puis par nom.
    const byClient = (a, b) => compareClients(a.client, b.client) || a.name.localeCompare(b.name);
    let list = [...(sites || [])].sort(byClient);
    if (target !== "all") {
      // Vue d'un technicien : par client, puis par urgence de relevé
      // (même ordre que ce que voit le technicien).
      list = groupSitesByClient(
        list.filter((s) => assignedForTarget.has(s.id)),
        lastBySite
      ).flatMap((g) => g.sites);
    } else {
      // Vue Tous : sites non attribués d'abord, puis regroupés tech par tech
      // (ordre des techniciens), puis par client et par nom.
      const rank = {};
      users.forEach((u, i) => (rank[u.id] = i + 1));
      const groupOf = (s) => {
        const uid = techsBySite[s.id]?.[0];
        return uid ? rank[uid] ?? users.length + 1 : 0;
      };
      list.sort((a, b) => groupOf(a) - groupOf(b) || byClient(a, b));
    }
    const q = search.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, target, assignedForTarget, search, users, techsBySite, lastBySite]);

  const clientGroups = useMemo(() => {
    const m = new Map();
    for (const s of visibleSites) {
      const c = s.client || "";
      if (!m.has(c)) m.set(c, []);
      m.get(c).push(s);
    }
    return [...m.entries()]
      .map(([client, list]) => {
        const counts = { red: 0, orange: 0, green: 0 };
        for (const s of list) counts[releveStatus(lastBySite[s.id])]++;
        return { client, sites: list, counts };
      })
      .sort(
        (a, b) =>
          b.counts.red - a.counts.red || b.counts.orange - a.counts.orange || compareClients(a.client, b.client)
      );
  }, [visibleSites, lastBySite]);

  const clientList = useMemo(
    () => [...new Set((sites || []).map((s) => s.client).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [sites]
  );

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

  function toggleSelect(id) {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }
  const allVisibleSelected = visibleSites.length > 0 && visibleSites.every((s) => selected.has(s.id));
  function toggleSelectAll() {
    setSelected(allVisibleSelected ? new Set() : new Set(visibleSites.map((s) => s.id)));
  }

  async function removeSelected() {
    setRemoving(true);
    setError("");
    try {
      const n = selected.size;
      await admin.unassignSites([...selected], target);
      setSelected(new Set());
      setConfirmRemove(false);
      showToast(`${n} site${n > 1 ? "s" : ""} retiré${n > 1 ? "s" : ""}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRemoving(false);
  }

  // Vue "Tous" : suppression définitive des sites cochés.
  async function deleteSelected() {
    setRemoving(true);
    setError("");
    try {
      const ids = [...selected];
      const names = (sites || []).filter((s) => selected.has(s.id)).map((s) => s.name);
      await db.deleteSites(ids);
      names.forEach((n) => removeSiteCoord(n));
      setSelected(new Set());
      setConfirmRemove(false);
      showToast(`${ids.length} site${ids.length > 1 ? "s" : ""} supprimé${ids.length > 1 ? "s" : ""}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRemoving(false);
  }

  // Vue "Tous" : attribue les sites cochés à un technicien.
  async function assignSelected() {
    if (!assignTo) return;
    setRemoving(true);
    setError("");
    try {
      const already = new Set(assignments.filter((a) => a.user_id === assignTo).map((a) => a.site_id));
      const n = await admin.assignSites([...selected], assignTo, already);
      const who = users.find((u) => u.id === assignTo)?.username || "";
      setSelected(new Set());
      showToast(n ? `${n} site${n > 1 ? "s" : ""} attribué${n > 1 ? "s" : ""} à ${who}` : `Déjà attribués à ${who}`);
      await load();
    } catch (e) {
      setError(e.message);
    }
    setRemoving(false);
  }

  if (sites === null) return <p className="text-[#7d868d] text-sm">Chargement…</p>;

  const targetName = target === "all" ? "Tous" : users.find((u) => u.id === target)?.username;

  // Une ligne de site dans la liste (arr = la liste qui la contient).
  const renderSiteRow = (s, i, arr) => (
    <div
      key={s.id}
      style={{ borderLeft: `4px solid ${techsBySite[s.id]?.length ? colorByUser[techsBySite[s.id][0]] : "transparent"}` }}
      className={`flex items-center transition-colors ${selected.has(s.id) ? "bg-[#2b7fff]/10" : "hover:bg-[#15191c]"} ${
        i !== arr.length - 1 ? "border-b border-[#272d32]" : ""
      }`}
    >
      <button
        onClick={() => setManage(s)}
        className="min-w-0 flex-1 flex items-center gap-3 pl-3 pr-2 py-3.5 text-left"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: STATUS_COLORS[releveStatus(lastBySite[s.id])] }}
          title="Statut du dernier relevé"
        />
        <MapPin
          size={15}
          className={`shrink-0 ${s.lat != null ? "text-[#2b7fff]" : "text-[#4a5157]"}`}
        />
        {/* Vue Tous : attribué (couleur du tech) ou non attribué */}
      {target !== "all" ? null : techsBySite[s.id]?.length ? (
        <span
          className="shrink-0 w-[92px] text-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded truncate"
          style={{
            color: colorByUser[techsBySite[s.id][0]] || "#c2c8cd",
            background: `${colorByUser[techsBySite[s.id][0]] || "#7d868d"}1f`,
          }}
          title={techsBySite[s.id].map((uid) => users.find((u) => u.id === uid)?.username).join(", ")}
        >
          Attribué
        </span>
      ) : (
        <span className="shrink-0 w-[92px] text-center text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-[#aab3ba] bg-[#272d32]">
          Non attribué
        </span>
      )}
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
      </button>
      <CheckBox
        checked={selected.has(s.id)}
        onClick={() => toggleSelect(s.id)}
        color={techsBySite[s.id]?.length ? colorByUser[techsBySite[s.id][0]] : undefined}
        className="mx-1"
      />
      <button onClick={() => setManage(s)} className="pl-1 pr-4 py-3.5" aria-label="Gérer le site">
        <ChevronRight size={16} className="text-[#7d868d] shrink-0" />
      </button>
    </div>
  );

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

      {/* Sur PC : liste à gauche, carte à droite (collée en haut au défilement).
          Sur téléphone : carte au-dessus de la liste, comme avant. */}
      <div ref={gridRef} className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-6 lg:items-start">
      <div className="lg:col-start-2 lg:row-start-1 lg:sticky" style={{ top: mapTop }}>
      {/* Aperçu carte : bascule couleur seulement sur "Tous" ; un technicien
          est toujours affiché par statut de relevé. */}
      <AdminMapPreview
        points={mapPoints}
        colorMode={allColorMode}
        onColorMode={target === "all" ? setAllColorMode : null}
        tall
      />
      </div>
      <div className="lg:col-start-1 lg:row-start-1 min-w-0">

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
      <div className="flex items-center gap-2 mb-2">
        {visibleSites.length > 0 && (
          <CheckBox checked={allVisibleSelected} onClick={toggleSelectAll} title="Tout sélectionner" />
        )}
        <p className="text-[11px] text-[#7d868d]">
          {visibleSites.length} site(s){target !== "all" ? " affecté(s)" : ""} · touche un site pour le gérer
        </p>
      </div>

      {/* Barre d'action (vue Tous) : attribuer à un technicien ou supprimer définitivement */}
      {target === "all" && selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-2 px-3 py-2.5 rounded-lg border border-[#2b7fff]/30 bg-[#11161d]">
          {!confirmRemove ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-white mr-auto">
                {selected.size} site{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="bg-[#15191c] border border-[#272d32] rounded-lg px-2 py-1.5 text-sm text-white focus:border-[#2b7fff] focus:outline-none"
              >
                <option value="">Choisir un tech…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.username}
                  </option>
                ))}
              </select>
              <button
                onClick={assignSelected}
                disabled={!assignTo || removing}
                className="btn-accent flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
              >
                <Users size={14} />
                {removing ? "…" : "Attribuer"}
              </button>
              <button
                onClick={() => setConfirmRemove(true)}
                disabled={removing}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#e5484d] hover:bg-[#d13b40] px-3 py-1.5 rounded-lg"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-[#c2c8cd] px-3 py-1.5 rounded-lg border border-[#272d32] hover:bg-[#15191c]"
              >
                Annuler
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle size={16} className="text-[#ff8a8a] shrink-0 mt-0.5" />
                <span className="text-sm text-[#c2c8cd]">
                  Supprimer définitivement <span className="text-white font-semibold">{selected.size}</span> site
                  {selected.size > 1 ? "s" : ""} et toutes leurs données (relevés, chaudières, photos…) ? Action
                  irréversible.
                </span>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setConfirmRemove(false)}
                  disabled={removing}
                  className="text-sm text-[#c2c8cd] px-3 py-1.5 rounded-lg border border-[#272d32] hover:bg-[#15191c]"
                >
                  Non
                </button>
                <button
                  onClick={deleteSelected}
                  disabled={removing}
                  className="text-sm font-semibold text-white bg-[#e5484d] hover:bg-[#d13b40] px-3 py-1.5 rounded-lg disabled:opacity-60"
                >
                  {removing ? "…" : "Oui, supprimer"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Barre d'action : retirer les sites cochés du technicien */}
      {target !== "all" && selected.size > 0 && (
        <div className="sticky top-0 z-10 mb-2 px-3 py-2.5 rounded-lg border border-[#ff5c5c]/30 bg-[#1a1214]">
          {!confirmRemove ? (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-white">
                {selected.size} site{selected.size > 1 ? "s" : ""} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setSelected(new Set())}
                className="text-sm text-[#c2c8cd] px-3 py-1.5 rounded-lg border border-[#272d32] hover:bg-[#15191c]"
              >
                Annuler
              </button>
              <button
                onClick={() => setConfirmRemove(true)}
                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-[#e5484d] hover:bg-[#d13b40] px-3 py-1.5 rounded-lg"
              >
                <Trash2 size={14} />
                Retirer de {targetName}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex-1 text-sm text-[#c2c8cd]">
                Retirer <span className="text-white font-semibold">{selected.size}</span> site
                {selected.size > 1 ? "s" : ""} de <span className="text-white font-semibold">{targetName}</span> ?
              </span>
              <button
                onClick={() => setConfirmRemove(false)}
                disabled={removing}
                className="text-sm text-[#c2c8cd] px-3 py-1.5 rounded-lg border border-[#272d32] hover:bg-[#15191c]"
              >
                Non
              </button>
              <button
                onClick={removeSelected}
                disabled={removing}
                className="text-sm font-semibold text-white bg-[#e5484d] hover:bg-[#d13b40] px-3 py-1.5 rounded-lg disabled:opacity-60"
              >
                {removing ? "…" : "Oui, retirer"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Liste des sites : une carte par client (le plus en retard en premier).
          Toucher un client affiche ses sites. */}
      {visibleSites.length === 0 && (
        <p className="text-[#7d868d] text-sm px-4 py-3 border border-[#272d32] rounded-xl">Aucun site.</p>
      )}
      {clientGroups.map((g) => {
        const key = g.client || "_none";
        const open = search.trim() !== "" || openClients.has(key);
        const allSel = g.sites.every((x) => selected.has(x.id));
        return (
          <div key={key} className="mb-2.5">
            <div
              className={`flex items-center rounded-xl border transition-colors ${
                open ? "border-[#2b7fff]/40 bg-[#2b7fff]/5" : "border-[#272d32] bg-[#15191c] hover:border-[#3a4147]"
              }`}
            >
              <button
                onClick={() => toggleClient(key)}
                className="min-w-0 flex-1 flex items-center gap-3 pl-4 pr-2 py-3.5 text-left"
              >
                <ClientLogo client={g.client} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-white font-bold text-base truncate">{g.client || "Sans client"}</span>
                  <span className="block text-[12px] text-[#7d868d]">
                    {g.sites.length} site{g.sites.length > 1 ? "s" : ""}
                    {target === "all" &&
                      (() => {
                        const n = g.sites.filter((x) => !techsBySite[x.id]?.length).length;
                        return n ? ` · ${n} non attribué${n > 1 ? "s" : ""}` : " · tous attribués";
                      })()}
                  </span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  {["red", "orange", "green"].map((st) =>
                    g.counts[st] ? (
                      <span
                        key={st}
                        className="min-w-[26px] text-center text-[12px] font-bold tabular-nums px-1.5 py-0.5 rounded-md"
                        style={{ color: STATUS_COLORS[st], background: `${STATUS_COLORS[st]}1f` }}
                      >
                        {g.counts[st]}
                      </span>
                    ) : null
                  )}
                </span>
              </button>
              {/* Cocher tous les sites de ce client */}
              <CheckBox
                checked={allSel}
                title="Sélectionner tous les sites de ce client"
                onClick={() =>
                  setSelected((prev) => {
                    const n = new Set(prev);
                    g.sites.forEach((x) => (allSel ? n.delete(x.id) : n.add(x.id)));
                    return n;
                  })
                }
              />
              <button onClick={() => toggleClient(key)} className="pl-1 pr-4 py-3.5" aria-label="Ouvrir le client">
                <ChevronDown size={18} className={`text-[#7d868d] transition-transform ${open ? "rotate-180" : ""}`} />
              </button>
            </div>

            {open && (
              <div className="mt-2">
                {target === "all" ? (
                  // Vue Tous : non attribués puis attribués, chacun avec son titre.
                  [
                    { label: "Non attribués", list: g.sites.filter((x) => !techsBySite[x.id]?.length) },
                    { label: "Attribués", list: g.sites.filter((x) => techsBySite[x.id]?.length) },
                  ]
                    .filter((part) => part.list.length)
                    .map((part) => (
                      <div key={part.label} className="mb-2">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-[#aab3ba] px-1 mb-1.5">
                          {g.client || "Sans client"} · {part.label}{" "}
                          <span className="text-[#7d868d] font-normal tabular-nums">{part.list.length}</span>
                        </p>
                        <div className="border border-[#272d32] rounded-xl overflow-hidden">
                          {part.list.map(renderSiteRow)}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="border border-[#272d32] rounded-xl overflow-hidden">{g.sites.map(renderSiteRow)}</div>
                )}
              </div>
            )}
          </div>
        );
      })}

      </div>
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
          clients={clientList}
          onOpenSite={onOpenSite}
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

// Case à cocher (grande zone de clic pour le tactile).
// color : couleur du technicien affecté (sinon gris / bleu par défaut).
function CheckBox({ checked, onClick, title, color, className = "" }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={title}
      aria-pressed={checked}
      className={`shrink-0 p-1.5 ${className}`}
    >
      <span
        className={`flex items-center justify-center w-5 h-5 rounded border-2 transition-colors ${
          color ? "" : checked ? "bg-[#2b7fff] border-[#2b7fff]" : "border-[#4a5157] hover:border-[#7d868d]"
        }`}
        style={color ? { borderColor: color, background: checked ? color : `${color}22` } : undefined}
      >
        {checked && <Check size={13} strokeWidth={3} className="text-white" />}
      </span>
    </button>
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
function SiteAdminModal({ site, clients = [], onOpenSite, onClose, onChanged }) {
  const [client, setClient] = useState(""); // saisie libre "Autre client"
  const [savedClient, setSavedClient] = useState(site.client || ""); // client actuel du site
  const [choice, setChoice] = useState(site.client || ""); // valeur du menu déroulant
  const OTHER = "__autre__";
  const clientOptions = [...new Set([...CLIENT_ORDER, ...clients.map((c) => c.toUpperCase()), ...(savedClient ? [savedClient] : [])])].sort(compareClients);
  const newClient = choice === OTHER ? client.trim() : choice;

  async function saveClient(value) {
    setBusy(true);
    setError("");
    try {
      await db.updateSiteClient(site.id, value);
      setSavedClient(value);
      setChoice(value);
      setClient("");
      onChanged(value ? `Client : ${value}` : "Client retiré", false);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);

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

      {/* Client (bailleur) : menu déroulant avec tous les clients connus. */}
      <p className="text-[#c2c8cd] text-xs font-semibold mb-2">Client</p>
      <div className="flex gap-2 mb-2">
        <div className="relative min-w-0 flex-1">
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="w-full appearance-none bg-[#15191c] border border-[#272d32] rounded-lg pl-3 pr-9 py-2 text-base text-white focus:border-[#2b7fff] focus:outline-none"
          >
            <option value="">Aucun client</option>
            {clientOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={OTHER}>Autre client…</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d868d] pointer-events-none"
          />
        </div>
        <button
          onClick={() => saveClient(newClient)}
          disabled={busy || newClient === savedClient || (choice === OTHER && !newClient)}
          className="btn-accent font-semibold text-sm px-4 rounded-lg disabled:opacity-50"
        >
          OK
        </button>
      </div>
      {choice === OTHER && (
        <input
          value={client}
          onChange={(e) => setClient(e.target.value.toUpperCase())}
          placeholder="Nom du nouveau client"
          autoFocus
          className="w-full bg-[#15191c] border border-[#272d32] rounded-lg px-3 py-2 text-base text-white placeholder-[#7d868d] focus:border-[#2b7fff] focus:outline-none mb-2"
        />
      )}
      <div className="mb-2" />

      {/* Ouvre la fiche complète du site (compteurs, chaudières, photos…). */}
      {onOpenSite && (
        <button
          onClick={() => onOpenSite(site.id)}
          className="btn-accent w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-lg"
        >
          <Info size={16} />
          Infos du site
        </button>
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
