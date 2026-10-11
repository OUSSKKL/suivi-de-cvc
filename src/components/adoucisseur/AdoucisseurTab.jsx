import { useState } from "react";

// Onglet "Adoucisseur" : état de marche, usage et niveau de sel en stock.
// Un seul adoucisseur par site (pas de liste) : les 3 réglages vivent
// directement sur la fiche du site, comme les kits d'allumage.
const SEL_LEVELS = ["0", "10 sacs", "1 palette", "2 palettes"];

export default function AdoucisseurTab({ etat, usage, sel, onChange, readOnly = false }) {
  const [selOpen, setSelOpen] = useState(false);
  const currentSel = sel ?? 0;

  function pickSel(index) {
    onChange({ sel: index });
    setSelOpen(false);
  }

  return (
    <fieldset disabled={readOnly} className="space-y-4 min-w-0 disabled:[&_button]:cursor-default">
      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4">
        <p className="text-[#929ba2] text-xs uppercase tracking-wide font-semibold mb-2">État</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ etat: "marche" })}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors ${
              etat === "marche"
                ? "bg-[#22c55e] text-[#06170c] border-[#22c55e]"
                : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
            }`}
          >
            Marche
          </button>
          <button
            type="button"
            onClick={() => onChange({ etat: "hs" })}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors ${
              etat === "hs"
                ? "bg-[#ff5d5d] text-[#1a0606] border-[#ff5d5d]"
                : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
            }`}
          >
            HS
          </button>
        </div>
      </div>

      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4">
        <p className="text-[#929ba2] text-xs uppercase tracking-wide font-semibold mb-2">Usage</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange({ usage: "ecs" })}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors ${
              usage === "ecs"
                ? "bg-[#2b7fff] text-[#ffffff] border-[#2b7fff]"
                : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
            }`}
          >
            ECS
          </button>
          <button
            type="button"
            onClick={() => onChange({ usage: "chauffage" })}
            className={`flex-1 py-3 rounded-lg text-sm font-semibold border transition-colors ${
              usage === "chauffage"
                ? "bg-[#2b7fff] text-[#ffffff] border-[#2b7fff]"
                : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
            }`}
          >
            Chauffage
          </button>
        </div>
      </div>

      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4">
        <p className="text-[#929ba2] text-xs uppercase tracking-wide font-semibold mb-2">Sel en stock</p>
        <button
          type="button"
          onClick={() => setSelOpen((o) => !o)}
          className="w-full py-4 rounded-lg bg-[#1a1f23] border border-[#3a4147] hover:bg-[#272d32] transition-colors"
        >
          <span className="font-display text-2xl font-extrabold text-white tabular-nums">
            {SEL_LEVELS[currentSel]}
          </span>
        </button>

        {readOnly ? null : selOpen ? (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {SEL_LEVELS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => pickSel(i)}
                className={`py-2.5 rounded-lg text-sm font-semibold border transition-colors ${
                  i === currentSel
                    ? "bg-[#2b7fff] text-[#ffffff] border-[#2b7fff]"
                    : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[#7d868d] text-[11px] mt-2 text-center">Appuie pour choisir</p>
        )}
      </div>
    </fieldset>
  );
}
