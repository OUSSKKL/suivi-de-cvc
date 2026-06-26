import { useState, useEffect } from "react";
import { Building2, Gauge, Plus, Search, Table, Flame, LogOut } from "lucide-react";
import { sortSites } from "../../utils/sortSites";
import * as db from "../../lib/db";
import SiteCard from "./SiteCard";
import AddSiteModal from "./AddSiteModal";

export default function SiteListView({ sites, allCount, search, setSearch, onOpen, onAdd, onDelete, onShowTableau, onShowKits, onShowChaudieres, onLogout }) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
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
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 sm:pt-10">
      <header className="mb-6">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 text-[#ff8a3d] font-mono text-xs uppercase tracking-[0.18em]">
            <Gauge size={14} strokeWidth={2.5} />
            Suivi CVC multi-sites
          </div>
          <button
            onClick={onLogout}
            className="text-[#7d868d] hover:text-[#e4e7ea] p-1"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut size={15} />
          </button>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Mes bâtiments {allCount}
        </h1>
      </header>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={onShowTableau}
          className="flex flex-col items-center justify-center gap-1.5 bg-[#15191c] hover:bg-[#1a1f23] border border-[#272d32] text-[#ffffff] font-semibold text-xs px-2 py-3 rounded-lg transition-colors text-center"
        >
          <Table size={16} className="text-[#ff8a3d]" />
          Relevés
        </button>
        <button
          onClick={onShowKits}
          className="flex flex-col items-center justify-center gap-1.5 bg-[#15191c] hover:bg-[#1a1f23] border border-[#272d32] text-[#ffffff] font-semibold text-xs px-2 py-3 rounded-lg transition-colors text-center"
        >
          <Flame size={16} className="text-[#ff8a3d]" />
          Kits
        </button>
        <button
          onClick={onShowChaudieres}
          className="flex flex-col items-center justify-center gap-1.5 bg-[#15191c] hover:bg-[#1a1f23] border border-[#272d32] text-[#ffffff] font-semibold text-xs px-2 py-3 rounded-lg transition-colors text-center"
        >
          <Flame size={16} className="text-[#ff8a3d]" />
          Chaudières
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7d868d]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un site, une adresse…"
            className="w-full bg-[#15191c] border border-[#272d32] rounded-lg pl-9 pr-3 py-2.5 text-sm placeholder-[#7d868d] text-[#ffffff]"
          />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#ff8a3d] hover:bg-[#ff9d5c] text-[#1a1006] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          <span className="hidden sm:inline">Site</span>
        </button>
      </div>

      {sites.length === 0 && allCount === 0 && (
        <div className="border border-dashed border-[#272d32] rounded-xl p-10 text-center mt-10">
          <Building2 size={28} className="mx-auto text-[#5a6168] mb-3" />
          <p className="text-[#e4e7ea] font-medium mb-1">Aucun site pour le moment</p>
          <p className="text-[#929ba2] text-sm mb-4">Ajoute ton premier bâtiment pour commencer le suivi.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="text-[#ff8a3d] text-sm font-semibold underline underline-offset-2"
          >
            Ajouter un site
          </button>
        </div>
      )}

      {sites.length === 0 && allCount > 0 && (
        <p className="text-[#929ba2] text-sm text-center mt-10">Aucun résultat pour « {search} ».</p>
      )}

      <div className="grid gap-2.5 mt-1">
        {sortSites(sites).map((s) => (
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
          name={name}
          address={address}
          setName={setName}
          setAddress={setAddress}
          onCancel={() => {
            setShowAdd(false);
            setName("");
            setAddress("");
          }}
          onSave={async () => {
            if (!name.trim()) return;
            const id = await onAdd(name, address);
            setShowAdd(false);
            setName("");
            setAddress("");
            onOpen(id);
          }}
        />
      )}
    </div>
  );
}
