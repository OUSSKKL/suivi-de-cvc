import { ChevronLeft, Droplets, Building2 } from "lucide-react";
import { sortSites } from "../../utils/sortSites";
import EmptyState from "../shared/EmptyState";

const SEL_LEVELS = ["0", "10 sacs", "1 palette", "2 palettes"];

// Les 3 réglages (état, usage, sel) vivent déjà sur la fiche du site : pas
// besoin de requête supplémentaire, contrairement aux chaudières/pots à boue.
export default function AdoucisseurTableView({ sites, onBack }) {
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
          <Droplets size={17} className="text-[#2b7fff]" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">Adoucisseurs par site</h1>
      </div>

      <p className="text-[#7d868d] text-xs mb-5">Modifiable depuis l'onglet Adoucisseur de chaque site.</p>

      {sortedSites.length === 0 ? (
        <EmptyState
          icon={Droplets}
          title="Aucun site"
          message="Ajoute un site depuis l'écran principal pour suivre ses adoucisseurs."
          action={onBack}
          actionLabel="Retour aux sites"
        />
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {sortedSites.map((site, i) => {
            // Un site n'est considéré équipé que si l'état ET l'usage ont
            // été explicitement réglés dans son onglet Adoucisseur.
            const hasAdoucisseur = site.adoucisseurEtat != null && site.adoucisseurUsage != null;
            return (
              <div
                key={site.id}
                className={`flex flex-col gap-2 px-4 py-3 hover:bg-[#15191c] transition-colors ${
                  i !== sortedSites.length - 1 ? "border-b border-[#272d32]" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2b7fff]/20 to-[#2b7fff]/5 ring-1 ring-[#2b7fff]/15 flex items-center justify-center shrink-0">
                    <Building2 size={14} className="text-[#2b7fff]" />
                  </div>
                  <span className="flex-1 text-white text-sm font-medium truncate">{site.name}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pl-11">
                  {hasAdoucisseur ? (
                    <>
                      <span
                        className={`text-[11px] font-semibold rounded-full px-2.5 py-1 ${
                          site.adoucisseurEtat === "hs"
                            ? "text-[#ff5d5d] bg-[#ff5d5d]/10"
                            : "text-[#22c55e] bg-[#22c55e]/10"
                        }`}
                      >
                        {site.adoucisseurEtat === "hs" ? "HS" : "Marche"}
                      </span>
                      <span className="text-[11px] font-semibold text-[#2b7fff] bg-[#2b7fff]/10 rounded-full px-2.5 py-1">
                        {site.adoucisseurUsage === "chauffage" ? "Chauffage" : "ECS"}
                      </span>
                      <span className="text-[11px] font-semibold text-[#c2c8cd] bg-[#1a1f23] border border-[#272d32] rounded-full px-2.5 py-1">
                        Sel : {SEL_LEVELS[site.adoucisseurSel ?? 0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] font-medium text-[#5a6168] bg-[#1a1f23] rounded-full px-2.5 py-1">
                      Pas d'adoucisseur
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
