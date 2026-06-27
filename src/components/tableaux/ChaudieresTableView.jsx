import { useState, useEffect } from "react";
import { ChevronLeft, Flame, Building2, Download } from "lucide-react";
import * as db from "../../lib/db";
import { sortSites } from "../../utils/sortSites";
import { downloadCSV } from "../../lib/download";
import LoadingRow from "../shared/LoadingRow";
import EmptyState from "../shared/EmptyState";

export default function ChaudieresTableView({ sites, onBack }) {
  const [chaudieresBySite, setChaudieresBySite] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await db.listAllChaudieres();
        const result = {};
        for (const c of all) {
          (result[c.siteId] ||= []).push(c);
        }
        setChaudieresBySite(result);
      } catch (e) {
        setChaudieresBySite({});
      }
    })();
  }, []);

  // Regroupe les modèles d'un site en entrées comptées : [["MCA 45", 2], ...]
  function modelesEntries(list) {
    if (!list || list.length === 0) return [];
    const counts = {};
    for (const c of list) {
      const label = [c.marque, c.modele].filter(Boolean).join(" ").trim() || "Sans modèle";
      counts[label] = (counts[label] || 0) + (c.quantite || 1);
    }
    return Object.entries(counts);
  }

  function totalQuantite(list) {
    return (list || []).reduce((sum, c) => sum + (c.quantite || 1), 0);
  }

  // Couleur de la puce selon la marque détectée dans le libellé.
  function brandStyle(label) {
    const l = label.toLowerCase();
    if (l.includes("atlantic")) return "text-[#5a9eff] bg-[#2b7fff]/10 border-[#2b7fff]/25";
    if (l.includes("dietrich")) return "text-[#eab308] bg-[#eab308]/10 border-[#eab308]/25";
    if (l.includes("viessmann")) return "text-[#fb923c] bg-[#fb923c]/10 border-[#fb923c]/25";
    if (l.includes("vapeur")) return "text-[#a78bfa] bg-[#a78bfa]/10 border-[#a78bfa]/25";
    return "text-[#c2c8cd] bg-[#1a1f23] border-[#272d32]";
  }

  const sortedSites = sortSites(sites);

  function exportCSV() {
    const rows = sortedSites.map((site) => {
      const list = chaudieresBySite[site.id] || [];
      const entries = modelesEntries(list);
      const modeles = entries.length > 0
        ? entries.map(([label, n]) => (n > 1 ? `${n}× ${label}` : label)).join(", ")
        : "—";
      return [site.name, totalQuantite(list), modeles];
    });
    const today = new Date().toISOString().slice(0, 10);
    downloadCSV(`chaudieres_${today}.csv`, ["Site", "Nombre de chaudières", "Modèles"], rows);
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
            <Flame size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Chaudières par site</h1>
        </div>
        <button
          onClick={exportCSV}
          disabled={!chaudieresBySite || sortedSites.length === 0}
          className="flex items-center gap-1.5 bg-[#1a1f23] hover:bg-[#272d32] disabled:opacity-40 disabled:hover:bg-[#1a1f23] border border-[#3a4147] text-white font-medium text-sm px-3.5 py-2 rounded-lg transition-colors shrink-0"
        >
          <Download size={15} />
          <span className="hidden sm:inline">Télécharger</span>
        </button>
      </div>

      <p className="text-[#7d868d] text-xs mb-5">Ajoute ou modifie les fiches depuis chaque site.</p>

      {sortedSites.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="Aucun site"
          message="Ajoute un site depuis l'écran principal pour suivre ses chaudières."
          action={onBack}
          actionLabel="Retour aux sites"
        />
      ) : chaudieresBySite === null ? (
        <LoadingRow />
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {sortedSites.map((site, i) => {
            const list = chaudieresBySite[site.id] || [];
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
                  <span className="font-display font-bold text-sm text-[#2b7fff] bg-[#2b7fff]/10 tabular-nums min-w-[2.5ch] text-center px-2.5 py-1 rounded-full shrink-0">
                    {totalQuantite(list)}
                  </span>
                </div>
                {entries.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pl-11">
                    {entries.map(([label]) => (
                      <span
                        key={label}
                        className={`text-sm font-semibold rounded-md px-2.5 py-1 border ${brandStyle(label)}`}
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#5a6168] text-xs pl-11">Aucune chaudière enregistrée</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
