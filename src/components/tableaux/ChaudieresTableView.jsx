import { useState, useEffect } from "react";
import { ChevronLeft, Flame } from "lucide-react";
import * as db from "../../lib/db";
import { sortSites } from "../../utils/sortSites";
import LoadingRow from "../shared/LoadingRow";

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

  // Résume les modèles d'un site : "2× MCA 45, 1× Varfree 80"
  function modelesResume(list) {
    if (!list || list.length === 0) return "—";
    const counts = {};
    for (const c of list) {
      const label = [c.marque, c.modele].filter(Boolean).join(" ").trim() || "Sans modèle";
      counts[label] = (counts[label] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, n]) => (n > 1 ? `${n}× ${label}` : label))
      .join(", ");
  }

  const sortedSites = sortSites(sites);
  const totalChaudieres = chaudieresBySite
    ? Object.values(chaudieresBySite).reduce((sum, l) => sum + l.length, 0)
    : 0;

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
        Chaudières par site
      </h1>
      <p className="text-[#929ba2] text-xs mb-4">
        Total : <span className="text-white font-semibold">{totalChaudieres}</span> chaudière{totalChaudieres !== 1 ? "s" : ""}. Ajoute ou modifie les chaudières dans chaque site.
      </p>

      {chaudieresBySite === null ? (
        <LoadingRow />
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          <div className="flex items-center bg-[#1a1f23] px-3 py-2.5 border-b border-[#272d32] gap-2">
            <span className="flex-1 text-[#929ba2] text-xs font-semibold uppercase tracking-wide">Site</span>
            <span className="w-10 text-center text-[#929ba2] text-xs font-semibold uppercase tracking-wide shrink-0">Nb</span>
            <span className="flex-1 text-[#929ba2] text-xs font-semibold uppercase tracking-wide">Modèle(s)</span>
          </div>
          {sortedSites.map((site, i) => {
            const list = chaudieresBySite[site.id] || [];
            return (
              <div
                key={site.id}
                className={`flex items-center px-3 py-3 gap-2 ${
                  i !== sortedSites.length - 1 ? "border-b border-[#272d32]" : ""
                }`}
              >
                <span className="flex-1 text-white text-xs font-medium truncate">{site.name}</span>
                <span className="w-10 text-center font-display font-bold text-base text-[#ff8a3d] tabular-nums shrink-0">
                  {list.length}
                </span>
                <span className="flex-1 text-[#c2c8cd] text-xs truncate" title={modelesResume(list)}>
                  {modelesResume(list)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
