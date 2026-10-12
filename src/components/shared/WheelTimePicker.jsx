import { useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

// Sélecteur d'heure "roue" : deux colonnes (heures, minutes) qu'on fait
// défiler vers le haut / le bas. La valeur au centre (bande bleue) est
// l'heure choisie. S'ouvre sur l'heure passée en value (par défaut : maintenant).
const ITEM_H = 44; // hauteur d'une ligne (px)
const VISIBLE = 5; // lignes visibles (impair : une au centre)
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;
const ARROW_H = 26; // hauteur des boutons ▲ ▼ (py-1 + icône 18px)

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Wheel({ items, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const index = Math.max(0, items.indexOf(value));
  const first = useRef(true);
  // Valeurs à jour pour l'écouteur de molette (attaché une seule fois).
  const live = useRef({ index, items, onChange });
  live.current = { index, items, onChange };

  // Position initiale (instantanée), puis animation douce à chaque changement.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const target = index * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) {
      if (first.current) el.scrollTop = target;
      else el.scrollTo({ top: target, behavior: "smooth" });
    }
    first.current = false;
  }, [index]);

  // PC : un cran de molette = une valeur (au lieu d'un défilement libre).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function onWheel(e) {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 1) return;
      step(e.deltaY > 0 ? 1 : -1);
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function step(dir) {
    const { index: i, items: list, onChange: change } = live.current;
    const next = Math.min(list.length - 1, Math.max(0, i + dir));
    if (next !== i) change(list[next]);
  }

  function onScroll() {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)));
      if (items[i] !== value) onChange(items[i]);
    }, 90);
  }

  const arrow =
    "w-full flex items-center justify-center py-1 text-[#7d868d] hover:text-white hover:bg-[#1a1f23] rounded-md transition-colors";

  return (
    <div className="relative flex-1 flex flex-col items-stretch">
      <button type="button" onClick={() => step(-1)} className={arrow} aria-label="Valeur précédente">
        <ChevronUp size={18} />
      </button>
      <div
        ref={ref}
        onScroll={onScroll}
        className="overflow-y-scroll no-scrollbar snap-y snap-mandatory overscroll-contain"
        style={{ height: ITEM_H * VISIBLE, paddingTop: PAD, paddingBottom: PAD }}
      >
        {items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => it !== value && onChange(it)}
            className={`block w-full snap-center text-center font-display tabular-nums transition-colors ${
              it === value ? "text-white text-2xl font-extrabold" : "text-[#7d868d] text-lg font-semibold"
            }`}
            style={{ height: ITEM_H }}
          >
            {it}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => step(1)} className={arrow} aria-label="Valeur suivante">
        <ChevronDown size={18} />
      </button>
    </div>
  );
}

export default function WheelTimePicker({ value, onChange, onDone, title }) {
  const [h, m] = (value || nowHHMM()).split(":");

  return (
    <div className="bg-[#0f1214] border border-[#2b7fff]/40 rounded-xl p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-[#c2c8cd]">{title}</p>
        <button
          type="button"
          onClick={() => onChange(nowHHMM())}
          className="text-xs font-semibold text-[#2b7fff] hover:underline underline-offset-2"
        >
          Maintenant
        </button>
      </div>

      <div className="relative flex items-center select-none">
        {/* Bande du centre = valeur choisie */}
        <div
          className="absolute inset-x-0 rounded-lg bg-[#2b7fff]/15 border border-[#2b7fff]/40 pointer-events-none"
          style={{ top: ARROW_H + PAD, height: ITEM_H }}
        />
        {/* Fondu haut / bas */}
        <div
          className="absolute inset-x-0 pointer-events-none z-10"
          style={{ top: ARROW_H, height: PAD, background: "linear-gradient(#0f1214, rgba(15,18,20,0))" }}
        />
        <div
          className="absolute inset-x-0 pointer-events-none z-10"
          style={{ bottom: ARROW_H, height: PAD, background: "linear-gradient(rgba(15,18,20,0), #0f1214)" }}
        />

        <Wheel items={HOURS} value={h} onChange={(nh) => onChange(`${nh}:${m}`)} />
        <span className="font-display text-2xl font-extrabold text-white px-1 relative z-20">:</span>
        <Wheel items={MINUTES} value={m} onChange={(nm) => onChange(`${h}:${nm}`)} />
      </div>

      <button
        type="button"
        onClick={onDone}
        className="btn-accent w-full mt-3 font-semibold text-sm py-2.5 rounded-lg"
      >
        OK
      </button>
    </div>
  );
}
