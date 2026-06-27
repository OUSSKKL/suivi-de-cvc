import { useState, useRef } from "react";
import { Flame, Trash2 } from "lucide-react";

// Carte chaudière : appui = agrandir la photo, balayage gauche = supprimer.
export default function ChaudiereCard({ chaudiere: c, onOpenPhoto, onDelete, onChangeQuantite }) {
  const DELETE_WIDTH = 88;
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startTranslate = useRef(0);
  const moved = useRef(false);
  const axis = useRef(null); // "x" | "y" | null tant que la direction n'est pas tranchée
  const pressed = useRef(false);

  const clamp = (x) => Math.max(-DELETE_WIDTH, Math.min(0, x));

  // Pointer Events unifie souris, doigt et stylet : une seule logique de
  // glissement marche partout (pas besoin de dupliquer touch/mouse).
  function onPointerDown(e) {
    pressed.current = true;
    startX.current = e.clientX;
    startY.current = e.clientY;
    startTranslate.current = translateX;
    moved.current = false;
    axis.current = null;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!pressed.current) return;
    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    if (axis.current === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    }
    if (axis.current === "y") return;

    if (Math.abs(dx) > 4) moved.current = true;
    setTranslateX(clamp(startTranslate.current + dx));
  }
  function onPointerEnd() {
    if (!pressed.current) return;
    pressed.current = false;
    setDragging(false);
    setTranslateX((curr) => (curr < -DELETE_WIDTH / 2 ? -DELETE_WIDTH : 0));
  }
  function handleTap() {
    if (moved.current) return;
    if (translateX !== 0) {
      setTranslateX(0);
      return;
    }
    onOpenPhoto();
  }

  function bumpQuantite(delta) {
    if (translateX !== 0) {
      setTranslateX(0);
      return;
    }
    onChangeQuantite(Math.max(1, (c.quantite || 1) + delta));
  }

  return (
    <div className="relative rounded-lg overflow-hidden bg-[#15191c]">
      {translateX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: DELETE_WIDTH }}>
          <button
            onClick={() => {
              setTranslateX(0);
              onDelete();
            }}
            className="flex-1 bg-[#ff5d5d] hover:bg-[#ff7a7a] text-[#1a0606] flex flex-col items-center justify-center gap-1 transition-colors"
            aria-label="Supprimer la chaudière"
          >
            <Trash2 size={17} />
            <span className="text-[11px] font-semibold">Supprimer</span>
          </button>
        </div>
      )}

      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
          cursor: dragging ? "grabbing" : "grab",
        }}
        className="touch-pan-y select-none relative bg-[#15191c] border border-[#272d32] rounded-l-lg"
      >
        <div className="w-full p-3.5 flex items-center gap-3">
          <button type="button" onClick={handleTap} className="flex items-center gap-3 flex-1 min-w-0 text-left">
            {c.photo ? (
              <img src={c.photo} alt="Plaque" className="w-9 h-9 rounded-lg object-cover border border-[#272d32] shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#1a1f23] flex items-center justify-center shrink-0 border border-[#272d32]">
                <Flame size={16} className="text-[#2b7fff]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#ffffff] truncate">{c.marque} {c.modele}</p>
              {c.photo && <p className="text-[#7d868d] text-[11px] mt-0.5">Appuie pour agrandir la plaque</p>}
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => bumpQuantite(-1)}
              className="w-7 h-7 rounded-md bg-[#1a1f23] border border-[#3a4147] hover:bg-[#272d32] text-white text-base font-semibold flex items-center justify-center"
              aria-label="Diminuer la quantité"
            >
              −
            </button>
            <span className="font-display font-bold text-base text-[#2b7fff] tabular-nums w-4 text-center">
              {c.quantite || 1}
            </span>
            <button
              type="button"
              onClick={() => bumpQuantite(1)}
              className="w-7 h-7 rounded-md bg-[#2b7fff] hover:bg-[#5a9eff] text-white text-base font-semibold flex items-center justify-center"
              aria-label="Augmenter la quantité"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
