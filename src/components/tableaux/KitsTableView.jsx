import { ChevronLeft, Flame } from "lucide-react";
import { sortSites } from "../../utils/sortSites";

export default function KitsTableView({ sites, onBack }) {
  const sortedSites = sortSites(sites);
  const total = sites.reduce((sum, s) => sum + (s.kits || 0), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[#c2c8cd] text-sm font-medium mb-3 -ml-1 px-1 py-1"
      >
        <ChevronLeft size={16} />
        Retour
      </button>
      <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2 mb-1">
        <Flame size={20} className="text-[#ff8a3d]" />
        Nombre de kits par site
      </h1>
      <p className="text-[#929ba2] text-xs mb-4">
        Total : <span className="text-white font-semibold">{total}</span> kit{total !== 1 ? "s" : ""} sur l'ensemble des sites. Modifie le nombre dans l'onglet Chaudières de chaque site.
      </p>

      <div className="border border-[#272d32] rounded-xl overflow-hidden">
        <div className="flex items-center bg-[#1a1f23] px-4 py-2.5 border-b border-[#272d32]">
          <span className="flex-1 text-[#929ba2] text-xs font-semibold uppercase tracking-wide">Site</span>
          <span className="text-[#929ba2] text-xs font-semibold uppercase tracking-wide">Nombre de kits</span>
        </div>
        {sortedSites.map((site, i) => (
          <div
            key={site.id}
            className={`flex items-center px-4 py-3 ${
              i !== sortedSites.length - 1 ? "border-b border-[#272d32]" : ""
            }`}
          >
            <span className="flex-1 text-white text-sm truncate pr-3">{site.name}</span>
            <span className="font-display font-bold text-lg text-[#ff8a3d] tabular-nums min-w-[2ch] text-right">
              {site.kits || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
