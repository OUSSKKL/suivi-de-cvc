import { useState, useRef } from "react";
import { Flame, Trash2 } from "lucide-react";

// Carte chaudière : appui = agrandir la photo, balayage gauche = supprimer.
export default function ChaudiereCard({ chaudiere: c, onOpenPhoto, onDelete }) {
  const DELETE_WIDTH = 88;
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startTranslate = useRef(0);
  const moved = useRef(false);

  const clamp = (x) => Math.max(-DELETE_WIDTH, Math.min(0, x));

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX;
    startTranslate.current = translateX;
    moved.current = false;
    setDragging(true);
  }
  function onTouchMove(e) {
    const dx = e.touches[0].clientX - startX.current;
    if (Math.abs(dx) > 4) moved.current = true;
    setTranslateX(clamp(startTranslate.current + dx));
  }
  function onTouchEnd() {
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
        className="relative bg-[#15191c] border border-[#272d32] rounded-lg"
      >
        <button
          type="button"
          onClick={handleTap}
          className="w-full text-left p-3.5 flex items-center gap-3"
        >
          {c.photo ? (
            <img src={c.photo} alt="Plaque" className="w-9 h-9 rounded-lg object-cover border border-[#272d32] shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[#1a1f23] flex items-center justify-center shrink-0 border border-[#272d32]">
              <Flame size={16} className="text-[#ff8a3d]" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[#ffffff] truncate">{c.marque} {c.modele}</p>
            {c.photo && <p className="text-[#7d868d] text-[11px] mt-0.5">Appuie pour agrandir la plaque</p>}
          </div>
        </button>
      </div>
    </div>
  );
}
