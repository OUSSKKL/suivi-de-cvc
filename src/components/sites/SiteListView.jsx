import { useState, useEffect } from "react";
import { Building2, Plus, Search, Table, Flame, Boxes, Clock, Headset, Package, LogOut } from "lucide-react";
import { sortSitesByStatus } from "../../utils/sortSites";
import * as db from "../../lib/db";
import SiteCard from "./SiteCard";
import AddSiteModal from "./AddSiteModal";
import MapPreview from "./MapPreview";
import EmptyState from "../shared/EmptyState";
import Logo from "../shared/Logo";

export default function SiteListView({ sites, allCount, search, setSearch, onOpen, onAdd, onDelete, onShowTableau, onShowKits, onShowChaudieres, onShowAstreinte, onShowMap, onShowSav, onShowFournisseur, onLogout }) {
  const [showAdd, setShowAdd] = useState(false);
  const [lastReadingBySite, setLastReadingBySite] = useState(null);

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
          <button
            onClick={onLogout}
            className="shrink-0 text-[#7d868d] hover:text-[#e4e7ea] hover:bg-[#15191c] p-2 rounded-lg transition-colors"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { onClick: onShowSav, icon: Headset, label: "SAV", color: "#22c55e" },
          { onClick: onShowChaudieres, icon: Flame, label: "Chaudières", color: "#f5a524" },
          { onClick: onShowAstreinte, icon: Clock, label: "Astreinte", color: "#2b7fff" },
          { onClick: onShowFournisseur, icon: Package, label: "Fournisseurs", color: "#a855f7" },
          { onClick: onShowKits, icon: Boxes, label: "Kits", color: "#06b6d4" },
          { onClick: onShowTableau, icon: Table, label: "Relevés", color: "#ec4899" },
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
        <button
          onClick={() => setShowAdd(true)}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span className="hidden sm:inline">Site</span>
        </button>
      </div>

      {sites.length > 0 && (
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
          <p className="text-[#929ba2] text-sm mb-4">Ajoute ton premier bâtiment pour commencer le suivi.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-[#2b7fff] text-sm font-semibold underline underline-offset-2"
          >
            Ajouter un site
          </button>
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

      <div className="grid gap-2.5 mt-1">
        {sortSitesByStatus(sites, lastReadingBySite).map((s) => (
          <SiteCard
            key={s.id}
            site={s}
            lastReading={lastReadingBySite?.[s.id]}
            showStatus={lastReadingBySite !== null}
            onOpen={() => onOpen(s.id)}
            onDelete={() => onDelete(s.id)}
          />
        ))}
      </div>

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
