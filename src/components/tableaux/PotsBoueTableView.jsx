import { useState, useEffect } from "react";
import { ChevronLeft, Waves, Building2, Download } from "lucide-react";
import * as db from "../../lib/db";
import { sortSites } from "../../utils/sortSites";
import { downloadCSV } from "../../lib/download";
import LoadingRow from "../shared/LoadingRow";
import EmptyState from "../shared/EmptyState";

export default function PotsBoueTableView({ sites, onBack }) {
  const [potsBoueBySite, setPotsBoueBySite] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await db.listAllPotsBoue();
        const result = {};
        for (const p of all) {
          (result[p.siteId] ||= []).push(p);
        }
        setPotsBoueBySite(result);
      } catch (e) {
        setPotsBoueBySite({});
      }
    })();
  }, []);

  // Regroupe les modèles d'un site en entrées comptées : [["Spirovent Dirtcal", 2], ...]
  function modelesEntries(list) {
    if (!list || list.length === 0) return [];
    const counts = {};
    for (const p of list) {
      const label = p.modele?.trim() || "Sans modèle";
      counts[label] = (counts[label] || 0) + (p.quantite || 1);
    }
    return Object.entries(counts);
  }

  function totalQuantite(list) {
    return (list || []).reduce((sum, p) => sum + (p.quantite || 1), 0);
  }

  const sortedSites = sortSites(sites);

  function exportCSV() {
    const rows = sortedSites.map((site) => {
      const list = potsBoueBySite[site.id] || [];
      const entries = modelesEntries(list);
      const modeles = entries.length > 0
        ? entries.map(([label, n]) => (n > 1 ? `${n}× ${label}` : label)).join(", ")
        : "—";
      return [site.name, totalQuantite(list), site.poches || 0, modeles];
    });
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`pots_boue_${today}.csv`, ["Site", "Nombre de pots à boue", "Poches en stock", "Modèles"], rows);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
            <Waves size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Pots à boue par site</h1>
        </div>
        <button
          onClick={exportCSV}
          disabled={!potsBoueBySite || sortedSites.length === 0}
          className="flex items-center gap-1.5 bg-[#1a1f23] hover:bg-[#272d32] disabled:opacity-40 disabled:hover:bg-[#1a1f23] border border-[#3a4147] text-white font-medium text-sm px-3.5 py-2 rounded-lg transition-colors shrink-0"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Télécharger</span>
        </button>
      </div>

      <p className="text-[#7d868d] text-xs mb-5">Ajoute ou modifie les fiches depuis l'onglet Pot à boue de chaque site.</p>

      {sortedSites.length === 0 ? (
        <EmptyState
          icon={Waves}
          title="Aucun site"
          message="Ajoute un site depuis l'écran principal pour suivre ses pots à boue."
          action={onBack}
          actionLabel="Retour aux sites"
        />
      ) : potsBoueBySite === null ? (
        <LoadingRow />
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {sortedSites.map((site, i) => {
            const list = potsBoueBySite[site.id] || [];
            const entries = modelesEntries(list);
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
                  <span
                    className="font-display font-bold text-xs text-[#06b6d4] bg-[#06b6d4]/10 tabular-nums px-2.5 py-1 rounded-full shrink-0"
                    title="Poches en stock"
                  >
                    {site.poches || 0} poche{(site.poches || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
                {entries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pl-11">
                    {entries.map(([label]) => (
                      <span
                        key={label}
                        className="text-sm font-semibold rounded-md px-2.5 py-1 border text-[#c2c8cd] bg-[#1a1f23] border-[#272d32]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5a6168] text-xs pl-11">Aucun pot à boue enregistré</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
