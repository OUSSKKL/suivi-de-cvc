import React, { useState, useEffect } from "react";
import { ChevronLeft, Table } from "lucide-react";
import * as db from "../../lib/db";
import { sortSites } from "../../utils/sortSites";
import { MOIS, MOIS_COURT } from "../../data/constants";
import LoadingRow from "../shared/LoadingRow";

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
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-[#0c0e10] border-b border-[#1a1f23] px-4 pt-4 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#c2c8cd] text-sm font-medium mb-3 -ml-1 px-1 py-1"
        >
          <ChevronLeft size={16} />
          Retour
        </button>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
            <Table size={20} className="text-[#ff8a3d]" />
            Tableau des relevés
          </h1>
          <div className="flex gap-2">
            <select
              value={selMonth}
              onChange={(e) => setSelMonth(Number(e.target.value))}
              className="bg-[#15191c] border border-[#3a4147] text-white rounded-lg px-3 py-2 text-sm font-semibold"
              aria-label="Mois"
            >
              {MOIS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
            <select
              value={selYear}
              onChange={(e) => setSelYear(Number(e.target.value))}
              className="bg-[#15191c] border border-[#3a4147] text-white rounded-lg px-3 py-2 text-sm font-semibold"
              aria-label="Année"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-[#929ba2] text-xs mt-2">
          Vert = relevé fait. Gauche = 1ʳᵉ quinzaine (1–15), droite = 2ᵉ quinzaine (16–fin).
        </p>
      </div>

      {readingsBySite === null ? (
        <LoadingRow />
      ) : (
        <div className="overflow-x-auto scrollbar-thin pb-10">
          <table className="border-collapse" style={{ minWidth: "max-content" }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-10 bg-[#0c0e10] text-left text-[#929ba2] text-xs font-semibold uppercase tracking-wide px-3 py-2 border-b border-[#272d32]"
                  style={{ minWidth: 160 }}
                >
                  Site
                </th>
                {shownMonths.map((mm) => (
                  <th
                    key={mm.abs}
                    colSpan={2}
                    className="text-center text-[#c2c8cd] text-xs font-semibold px-1 py-2 border-b border-l border-[#272d32]"
                  >
                    {MOIS_COURT[mm.month]} {String(mm.year).slice(2)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 z-10 bg-[#0c0e10] border-b border-[#272d32]"></th>
                {shownMonths.map((mm) => (
                  <React.Fragment key={mm.abs}>
                    <th className="text-center text-[#7d868d] text-[10px] font-medium px-1 py-1 border-b border-l border-[#272d32] w-9">1–15</th>
                    <th className="text-center text-[#7d868d] text-[10px] font-medium px-1 py-1 border-b border-l border-[#3a4147] w-9">16+</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedSites.map((site) => {
                const cells = cellsForSite(site.id);
                return (
                  <tr key={site.id}>
                    <td
                      className="sticky left-0 z-10 bg-[#0c0e10] text-white text-xs font-medium px-3 py-2 border-b border-[#272d32] whitespace-nowrap"
                      style={{ minWidth: 160, maxWidth: 220 }}
                    >
                      <span className="block truncate">{site.name}</span>
                    </td>
                    {shownMonths.map((mm) => (
                      <React.Fragment key={mm.abs}>
                        <td
                          className={`border-b border-l border-[#272d32] w-9 h-9 ${
                            cells.has(`${mm.abs}-0`) ? "bg-[#22c55e]" : ""
                          }`}
                        ></td>
                        <td
                          className={`border-b border-l border-[#3a4147] w-9 h-9 ${
                            cells.has(`${mm.abs}-1`) ? "bg-[#22c55e]" : ""
                          }`}
                        ></td>
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
