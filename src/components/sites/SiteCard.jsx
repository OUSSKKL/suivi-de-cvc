import { useState, useRef } from "react";
import { Building2, ChevronRight, Trash2 } from "lucide-react";
import { releveStatus, STATUS_COLORS, daysSince } from "../../utils/releveStatus";

export default function SiteCard({ site, lastReading, showStatus, onOpen, onDelete }) {
  const DELETE_WIDTH = 88;
  const status = showStatus ? releveStatus(lastReading) : null;
  const statusLabel = !lastReading
    ? "Jamais relevé"
    : `Dernier relevé il y a ${daysSince(lastReading)} j`;
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startTranslate = useRef(0);
  const moved = useRef(false);

  function clamp(x) {
    return Math.max(-DELETE_WIDTH, Math.min(0, x));
  }

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

  function handleOpen() {
    if (moved.current) return; // ignore tap-through after a swipe gesture
    if (translateX !== 0) {
      setTranslateX(0);
      return;
    }
    onOpen();
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#15191c]">
      {translateX < 0 && (
        <div className="absolute inset-y-0 right-0 flex items-stretch" style={{ width: DELETE_WIDTH }}>
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
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? "none" : "transform 0.2s ease-out",
        }}
        className="relative bg-[#15191c] border border-[#272d32] rounded-xl"
      >
        <button onClick={handleOpen} className="w-full text-left p-4 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#1a1f23] flex items-center justify-center shrink-0 border border-[#272d32]">
            <Building2 size={18} className="text-[#ff8a3d]" />
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
              style={{ backgroundColor: STATUS_COLORS[status] }}
            />
          )}
          <ChevronRight size={18} className="text-[#5a6168] shrink-0" />
        </button>
      </div>
    </div>
  );
}
