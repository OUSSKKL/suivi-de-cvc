import { useState, useEffect } from "react";
import { Building2, Plus, Search, Flame, Waves, Droplets, Clock, Headset, Package, LogOut, Shield, ChevronDown } from "lucide-react";
import { groupSitesByClientUrgency } from "../../utils/sortSites";
import { STATUS_COLORS } from "../../utils/releveStatus";
import * as db from "../../lib/db";
import SiteCard from "./SiteCard";
import AddSiteModal from "./AddSiteModal";
import MapPreview from "./MapPreview";
import EmptyState from "../shared/EmptyState";
import Logo from "../shared/Logo";
import ClientLogo from "../shared/ClientLogo";

export default function SiteListView({ sites, allCount, search, setSearch, onOpen, onAdd, onDelete, onShowPotsBoue, onShowAdoucisseur, onShowChaudieres, onShowAstreinte, onShowMap, onShowSav, onShowFournisseur, isAdmin, canManageSites, onShowAdmin, onLogout }) {
  const [showAdd, setShowAdd] = useState(false);
  const [lastReadingBySite, setLastReadingBySite] = useState(null);
  // Clients dépliés. Gardé pour la session : on retrouve la liste ouverte
  // en revenant d'une fiche site.
  const [openClients, setOpenClients] = useState(() => {
    try {
      return new Set(JSON.parse(sessionStorage.getItem("cvc:openClients") || "[]"));
    } catch {
      return new Set();
    }
  });
  function toggleClient(key) {
    setOpenClients((prev) => {
      // Un seul client ouvert à la fois : ouvrir un client ferme les autres.
      const n = prev.has(key) ? new Set() : new Set([key]);
      try {
        sessionStorage.setItem("cvc:openClients", JSON.stringify([...n]));
      } catch {
        /* stockage indisponible : tant pis */
      }
      return n;
    });
  }

  useEffect(() => {
    (async () => {
      try {
        const all = await db.listAllReleves();
        const result = {};
        for (const r of all) {
          if (!result[r.siteId] || r.date > result[r.siteId]) result[r.siteId] = r.date;
        }
        setLastReadingBySite(result);
      } catch (e) {
        setLastReadingBySite({});
      }
    })();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-5 animate-fade-in">
      <header className="mb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <Logo size={30} className="shrink-0" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 truncate">
              Mes sites
              <span className="text-sm font-bold text-[#2b7fff] bg-[#2b7fff]/10 px-2 py-0.5 rounded-full tabular-nums">
                {allCount}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {isAdmin && (
              <button
                onClick={onShowAdmin}
                className="text-[#2b7fff] hover:bg-[#2b7fff]/10 p-2 rounded-lg transition-colors"
                aria-label="Administration"
                title="Administration"
              >
                <Shield size={16} />
              </button>
            )}
            <button
              onClick={onLogout}
              className="text-[#7d868d] hover:text-[#e4e7ea] hover:bg-[#15191c] p-2 rounded-lg transition-colors"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { onClick: onShowSav, icon: Headset, label: "SAV", color: "#22c55e" },
          { onClick: onShowChaudieres, icon: Flame, label: "Chaudières", color: "#f5a524" },
          { onClick: onShowAstreinte, icon: Clock, label: "Astreinte", color: "#2b7fff" },
          { onClick: onShowFournisseur, icon: Package, label: "Fournisseurs", color: "#a855f7" },
          { onClick: onShowPotsBoue, icon: Waves, label: "Pot à boue", color: "#06b6d4" },
          { onClick: onShowAdoucisseur, icon: Droplets, label: "Adoucisseur", color: "#ec4899" },
        ].map(({ onClick, icon: Icon, label, color }) => (
          <button
            key={label}
            onClick={onClick}
            className="group flex flex-col items-center justify-center gap-2 bg-surface-gradient hover:border-[#3a4147] border border-[#272d32] text-[#ffffff] font-semibold text-xs px-2 py-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-card text-center"
          >
            <Icon size={18} style={{ color }} className="transition-transform group-hover:scale-110" />
            {label}
          </button>
        ))}
      </div>

      <MapPreview sites={sites} lastBySite={lastReadingBySite} onOpen={onShowMap} />

      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d868d] peer-focus:text-[#2b7fff]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un site, une adresse…"
            className="peer w-full bg-[#15191c] border border-[#272d32] rounded-lg pl-9 pr-3 py-2.5 text-base placeholder-[#7d868d] text-[#ffffff] transition-all focus:border-[#2b7fff] focus:shadow-[0_0_0_3px_rgba(43,127,255,0.12)] focus:outline-none"
          />
        </div>
        {canManageSites && (
          <button
            onClick={() => setShowAdd(true)}
            className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg shrink-0"
          >
            <Plus size={17} strokeWidth={2.5} />
            <span className="hidden sm:inline">Site</span>
          </button>
        )}
      </div>

      {sites.length > 0 && canManageSites && (
        <p className="text-[10px] text-[#5a6168] text-center -mt-3 mb-4">
          Balayer vers la gauche pour supprimer le site
        </p>
      )}

      {sites.length === 0 && allCount === 0 && (
        <div className="border border-dashed border-[#272d32] rounded-xl p-10 text-center mt-10 animate-fade-in">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#2b7fff]/15 to-transparent ring-1 ring-[#2b7fff]/10 flex items-center justify-center mx-auto mb-4">
            <Building2 size={26} className="text-[#2b7fff]/80" />
          </div>
          <p className="text-[#e4e7ea] font-medium mb-1">Aucun site pour le moment</p>
          <p className="text-[#929ba2] text-sm mb-4">
            {canManageSites
              ? "Ajoute ton premier bâtiment pour commencer le suivi."
              : "Aucun site ne t'a encore été affecté par l'administrateur."}
          </p>
          {canManageSites && (
            <button
              onClick={() => setShowAdd(true)}
              className="text-[#2b7fff] text-sm font-semibold underline underline-offset-2"
            >
              Ajouter un site
            </button>
          )}
        </div>
      )}

      {sites.length === 0 && allCount > 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="Aucun résultat"
            message={`Aucun site ne correspond à « ${search} ».`}
          />
        </div>
      )}

      {/* Une carte par client (le plus en retard en premier). Toucher un
          client affiche ses sites, triés par urgence de relevé. */}
      {(() => {
        const groups = groupSitesByClientUrgency(sites, lastReadingBySite);
        // Un seul groupe sans client : liste directe (affichage identique à avant).
        const showHeaders = groups.length > 1 || (groups[0] && groups[0].client);
        // Pendant une recherche, tous les clients sont dépliés.
        const searching = (search || "").trim() !== "";
        return groups.map((g) => {
          const key = g.client || "_none";
          const open = !showHeaders || searching || openClients.has(key);
          return (
          <div key={key} className="mt-1 mb-2.5">
            {showHeaders && (
              <button
                onClick={() => toggleClient(key)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors ${
                  open ? "border-[#2b7fff]/40 bg-[#2b7fff]/5" : "border-[#272d32] bg-[#15191c] hover:border-[#3a4147]"
                }`}
              >
                <ClientLogo client={g.client} size={40} />
                <span className="min-w-0 flex-1">
                  <span className="block text-white font-bold text-base truncate">{g.client || "Sans client"}</span>
                  <span className="block text-[12px] text-[#7d868d]">
                    {g.sites.length} site{g.sites.length > 1 ? "s" : ""}
                  </span>
                </span>
                {lastReadingBySite !== null && (
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
                )}
                <ChevronDown
                  size={18}
                  className={`text-[#7d868d] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </button>
            )}
            {open && (
            <div className={`grid gap-2.5 ${showHeaders ? "mt-2.5 mb-2" : ""}`}>
              {g.sites.map((s) => (
                <SiteCard
                  key={s.id}
                  site={s}
                  lastReading={lastReadingBySite?.[s.id]}
                  showStatus={lastReadingBySite !== null}
                  onOpen={() => onOpen(s.id)}
                  onDelete={() => onDelete(s.id)}
                  canDelete={canManageSites}
                />
              ))}
            </div>
            )}
          </div>
          );
        });
      })()}

      {showAdd && (
        <AddSiteModal
          withLocation
          onCancel={() => setShowAdd(false)}
          onSave={async (name, coords) => {
            const id = await onAdd(name, coords);
            setShowAdd(false);
            onOpen(id);
          }}
        />
      )}
    </div>
  );
}
