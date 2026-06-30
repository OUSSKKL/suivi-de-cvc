import { useState, useRef } from "react";
import { Building2, ChevronRight, Trash2 } from "lucide-react";
import { releveStatus, STATUS_COLORS, daysSince } from "../../utils/releveStatus";

export default function SiteCard({ site, lastReading, showStatus, onOpen, onDelete }) {
  const ACTIONS_WIDTH = 96;
  const status = showStatus ? releveStatus(lastReading) : null;
  const statusLabel = !lastReading
    ? "Jamais relevé"
    : `Dernier relevé il y a ${daysSince(lastReading)} j`;
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const lastDx = useRef(0);
  const axis = useRef(null); // "x" | "y" | null tant que la direction n'est pas tranchée
  const pressed = useRef(false);

  function clamp(x) {
    return Math.max(-ACTIONS_WIDTH, Math.min(0, x));
  }

  // Pointer Events unifie souris, doigt et stylet : une seule logique de
  // glissement marche partout (pas besoin de dupliquer touch/mouse).
  function onPointerDown(e) {
    pressed.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTranslate.current = translateX;
    lastDx.current = 0;
    axis.current = null;
    setDragging(true);
    // Pas de capture ici : on laisse le scroll vertical natif fonctionner. On ne
    // capture le pointeur qu'une fois un vrai swipe horizontal détecté.
  }

  function onPointerMove(e) {
    if (!pressed.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Détermine une seule fois la direction du geste : tant que le mouvement
    // est trop petit pour trancher, on ne fait rien (évite de "voler" un
    // scroll vertical qui démarre un peu en diagonale).
    if (axis.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (axis.current === "x") e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    if (axis.current === "y") return; // scroll vertical : on laisse le navigateur faire

    lastDx.current = dx;
    setTranslateX(clamp(startTranslate.current + dx));
  }

  // Relâchement normal : un vrai appui (déplacement < 8 px dans les deux axes,
  // jamais un swipe horizontal ni un scroll) ouvre la fiche.
  function onPointerUp(e) {
    if (!pressed.current) return;
    pressed.current = false;
    setDragging(false);
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const wasTap = axis.current !== "x" && Math.abs(dx) <= 8 && Math.abs(dy) <= 8;
    if (wasTap) {
      if (translateX !== 0) setTranslateX(0);
      else onOpen();
      return;
    }
    setTranslateX(translateX < -ACTIONS_WIDTH / 2 ? -ACTIONS_WIDTH : 0);
  }

  // Le navigateur a pris la main (scroll vertical) : on réinitialise SANS ouvrir.
  function onPointerCancel() {
    if (!pressed.current) return;
    pressed.current = false;
    setDragging(false);
    setTranslateX((curr) => (curr < -ACTIONS_WIDTH / 2 ? -ACTIONS_WIDTH : 0));
  }

  return (
    <div className={`relative rounded-xl overflow-hidden ${translateX < 0 ? "bg-[#ff5d5d]" : "bg-[#15191c]"}`}>
      {translateX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: ACTIONS_WIDTH }}>
          <button
            onClick={() => {
              setTranslateX(0);
              onDelete();
            }}
            className="flex-1 bg-[#ff5d5d] hover:bg-[#ff7a7a] text-[#1a0606] flex flex-col items-center justify-center gap-1 transition-colors"
            aria-label="Supprimer le site"
          >
            <Trash2 size={17} />
            <span className="text-[11px] font-semibold">Supprimer</span>
          </button>
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
          cursor: dragging ? "grabbing" : "grab",
        }}
        className="touch-pan-y select-none group/card relative bg-surface-gradient border border-[#272d32] rounded-xl transition-[border-color,box-shadow] hover:border-[#3a4147] hover:shadow-card"
      >
        <button type="button" className="w-full text-left p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#2b7fff]/20 to-[#2b7fff]/5 ring-1 ring-[#2b7fff]/15 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-[#2b7fff]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#ffffff] truncate">{site.name}</p>
            {site.address && <p className="text-[#aab3ba] text-xs truncate mt-0.5">{site.address}</p>}
          </div>
          {status && (
            <span
              title={statusLabel}
              aria-label={statusLabel}
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: STATUS_COLORS[status],
                boxShadow: `0 0 0 3px ${STATUS_COLORS[status]}22`,
              }}
            />
          )}
          <ChevronRight size={18} className="text-[#5a6168] shrink-0 transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-[#929ba2]" />
        </button>
      </div>
    </div>
  );
}
