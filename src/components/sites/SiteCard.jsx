import { useState, useRef } from "react";
import { Trash2, Navigation } from "lucide-react";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";
import { getAllSiteCoords } from "../../utils/siteLocations";

export default function SiteCard({ site, lastReading, showStatus, onOpen, onDelete }) {
  const ACTIONS_WIDTH = 96;
  const status = showStatus ? releveStatus(lastReading) : null;
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

  // Ouvre Waze vers le site : coordonnées GPS si connues, sinon l'adresse.
  function openItineraire(e) {
    e.stopPropagation();
    const c = getAllSiteCoords()[(site.name || "").trim().toUpperCase()];
    const url = c
      ? `https://waze.com/ul?ll=${c.lat},${c.lng}&navigate=yes`
      : `https://waze.com/ul?q=${encodeURIComponent(site.address || site.name)}&navigate=yes`;
    window.location.href = url;
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
          ...(status ? { borderLeft: `4px solid ${STATUS_COLORS[status]}` } : null),
        }}
        className="touch-pan-y select-none group/card relative bg-surface-gradient border border-[#272d32] rounded-xl transition-[border-color,box-shadow] hover:border-[#3a4147] hover:shadow-card"
      >
        <div className="w-full text-left p-4 flex items-center gap-3.5">
          <button
            type="button"
            onClick={openItineraire}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-10 h-10 rounded-lg bg-accent-gradient text-white shadow-glow flex items-center justify-center shrink-0 transition-transform active:scale-95 hover:brightness-110"
            aria-label="Itinéraire (Waze)"
            title="Itinéraire (Waze)"
          >
            <Navigation size={17} strokeWidth={2.4} className="translate-x-[-1px]" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[#ffffff] truncate">{site.name}</p>
            {site.address && <p className="text-[#aab3ba] text-xs truncate mt-0.5">{site.address}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
