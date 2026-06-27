import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Check, Table } from "lucide-react";
import * as db from "../../lib/db";
import { sortSites } from "../../utils/sortSites";
import { MOIS, MOIS_COURT } from "../../data/constants";
import LoadingRow from "../shared/LoadingRow";
import EmptyState from "../shared/EmptyState";

export default function TableauView({ sites, onBack }) {
  const [readingsBySite, setReadingsBySite] = useState(null);
  const now = new Date();
  // endIndex = index absolu du mois le plus récent affiché (année*12 + mois)
  const [endIndex, setEndIndex] = useState(now.getFullYear() * 12 + now.getMonth());

  useEffect(() => {
    (async () => {
      try {
        const all = await db.listAllReleves();
        const result = {};
        for (const r of all) {
          (result[r.siteId] ||= []).push(r);
        }
        setReadingsBySite(result);
      } catch (e) {
        setReadingsBySite({});
      }
    })();
  }, []);

  // Les 2 mois affichés : endIndex-1, endIndex
  const shownMonths = [endIndex - 1, endIndex].map((abs) => ({
    abs,
    year: Math.floor(abs / 12),
    month: ((abs % 12) + 12) % 12,
  }));

  // Pour un site : set de clés "abs-quinzaine" (abs = année*12+mois, quinzaine 0/1)
  function cellsForSite(siteId) {
    const set = new Set();
    const readings = readingsBySite?.[siteId] || [];
    for (const r of readings) {
      if (!r.date) continue;
      const d = new Date(r.date + "T00:00:00");
      const abs = d.getFullYear() * 12 + d.getMonth();
      const quinzaine = d.getDate() <= 15 ? 0 : 1;
      set.add(`${abs}-${quinzaine}`);
    }
    return set;
  }

  const sortedSites = sortSites(sites);

  // Options année et mois pour la navigation
  const years = [];
  for (let y = now.getFullYear() + 1; y >= 2023; y--) years.push(y);
  const selYear = Math.floor(endIndex / 12);
  const selMonth = ((endIndex % 12) + 12) % 12;

  function setSelYear(y) {
    setEndIndex(y * 12 + selMonth);
  }
  function setSelMonth(m) {
    setEndIndex(selYear * 12 + m);
  }

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="sticky top-0 z-20 bg-[#0c0e10]/95 backdrop-blur border-b border-[#1a1f23] px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-3 -ml-1 px-1 py-1 transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Retour
        </button>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
              <Table size={17} className="text-[#2b7fff]" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-white">Tableau des relevés</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEndIndex(endIndex - 1)}
              className="p-2 rounded-lg bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] hover:bg-[#1a1f23] text-[#c2c8cd] hover:text-white transition-colors"
              aria-label="Mois précédent"
            >
              <ChevronLeft size={15} />
            </button>

            <div className="relative">
              <select
                value={selMonth}
                onChange={(e) => setSelMonth(Number(e.target.value))}
                className="appearance-none bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] focus:border-[#2b7fff] text-white rounded-lg pl-3 pr-7 py-2 text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
                aria-label="Mois"
              >
                {MOIS.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7d868d] pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={selYear}
                onChange={(e) => setSelYear(Number(e.target.value))}
                className="appearance-none bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] focus:border-[#2b7fff] text-white rounded-lg pl-3 pr-7 py-2 text-sm font-semibold transition-colors focus:outline-none cursor-pointer"
                aria-label="Année"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7d868d] pointer-events-none" />
            </div>

            <button
              onClick={() => setEndIndex(endIndex + 1)}
              className="p-2 rounded-lg bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] hover:bg-[#1a1f23] text-[#c2c8cd] hover:text-white transition-colors"
              aria-label="Mois suivant"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[#929ba2] text-xs mt-2.5">
          <span className="w-2.5 h-2.5 rounded-[3px] bg-[#22c55e] shrink-0" />
          Relevé effectué
          <span className="text-[#3a4147] mx-0.5">·</span>
          Gauche = 1ʳᵉ quinzaine (1–15), droite = 2ᵉ quinzaine (16–fin)
        </div>
      </div>

      {sortedSites.length === 0 ? (
        <div className="px-4 pt-8">
          <EmptyState
            icon={Table}
            title="Aucun site à afficher"
            message="Ajoute un site depuis l'écran principal pour suivre ses relevés."
            action={onBack}
            actionLabel="Retour aux sites"
          />
        </div>
      ) : readingsBySite === null ? (
        <LoadingRow />
      ) : (
        <div className="mx-4 mt-4 mb-10 border border-[#272d32] rounded-xl overflow-x-auto scrollbar-thin">
          <table className="border-collapse" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-10 bg-[#0c0e10] border-r border-[#1a1f23] text-left text-[#929ba2] text-xs font-semibold uppercase tracking-wide px-3 py-2.5 border-b border-[#272d32]"
                  style={{ minWidth: 160 }}
                >
                  Site
                </th>
                {shownMonths.map((mm) => (
                  <th
                    key={mm.abs}
                    colSpan={2}
                    className="text-center text-[#c2c8cd] text-xs font-semibold px-1 py-2.5 border-b border-l border-[#272d32]"
                  >
                    {MOIS_COURT[mm.month]} {String(mm.year).slice(2)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0c0e10] border-r border-[#1a1f23] border-b border-[#272d32]"></th>
                {shownMonths.map((mm) => (
                  <React.Fragment key={mm.abs}>
                    <th className="text-center text-[#7d868d] text-[10px] font-medium px-1 py-1.5 border-b border-l border-[#272d32] w-9">1–15</th>
                    <th className="text-center text-[#7d868d] text-[10px] font-medium px-1 py-1.5 border-b border-l border-[#3a4147] w-9">16+</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSites.map((site) => {
                const cells = cellsForSite(site.id);
                return (
                  <tr key={site.id} className="group">
                    <td
                      className="sticky left-0 z-10 bg-[#0c0e10] group-hover:bg-[#15191c] border-r border-[#1a1f23] text-white text-xs font-medium px-3 py-2 border-b border-[#272d32] whitespace-nowrap transition-colors"
                      style={{ minWidth: 160, maxWidth: 220 }}
                    >
                      <span className="block truncate">{site.name}</span>
                    </td>
                    {shownMonths.map((mm) => (
                      <React.Fragment key={mm.abs}>
                        {[0, 1].map((q) => {
                          const done = cells.has(`${mm.abs}-${q}`);
                          return (
                            <td
                              key={q}
                              className={`border-b border-l ${q === 1 ? "border-[#3a4147]" : "border-[#272d32]"} w-9 h-9 p-0 ${
                                done ? "" : "group-hover:bg-white/[0.03] transition-colors"
                              }`}
                            >
                              {done && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-6 h-6 rounded-md bg-[#22c55e] flex items-center justify-center">
                                    <Check size={13} strokeWidth={3} className="text-[#06210f]" />
                                  </div>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
