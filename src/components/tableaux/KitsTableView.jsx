import { ChevronLeft, Boxes, Building2 } from "lucide-react";
import { sortSites } from "../../utils/sortSites";
import EmptyState from "../shared/EmptyState";

export default function KitsTableView({ sites, onBack }) {
  const sortedSites = sortSites(sites);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
          <Boxes size={17} className="text-[#2b7fff]" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">Kits par site</h1>
      </div>

      <p className="text-[#7d868d] text-xs mb-5">Modifiable depuis l'onglet Chaudières de chaque site.</p>

      {sortedSites.length === 0 ? (
        <EmptyState
          icon={Boxes}
          title="Aucun site"
          message="Ajoute un site depuis l'écran principal pour suivre ses kits."
          action={onBack}
          actionLabel="Retour aux sites"
        />
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {sortedSites.map((site, i) => (
            <div
              key={site.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-[#15191c] transition-colors ${
                i !== sortedSites.length - 1 ? "border-b border-[#272d32]" : ""
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2b7fff]/20 to-[#2b7fff]/5 ring-1 ring-[#2b7fff]/15 flex items-center justify-center shrink-0">
                <Building2 size={14} className="text-[#2b7fff]" />
              </div>
              <span className="flex-1 text-white text-sm font-medium truncate">{site.name}</span>
              <span className="font-display font-bold text-sm text-[#2b7fff] bg-[#2b7fff]/10 tabular-nums min-w-[2.5ch] text-center px-2.5 py-1 rounded-full shrink-0">
                {site.kits || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
