import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ModalShell({ children, onCancel, title, icon }) {
  // iOS Safari ne redimensionne pas la fenêtre visuelle quand le clavier
  // s'ouvre (les unités vh/dvh n'en tiennent pas compte) — seule l'API
  // visualViewport donne la hauteur réellement visible au-dessus du clavier.
  const [vh, setVh] = useState(() => window.visualViewport?.height ?? window.innerHeight);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const update = () => setVh(vv.height);
    update();
    vv.addEventListener("resize", update);
    return () => vv.removeEventListener("resize", update);
  }, []);

  // Verrouille le scroll de la page derrière la modale. Sans ça, focus sur
  // un champ pousse iOS Safari à scroller la page pour l'amener au-dessus
  // du clavier — ce scroll désynchronise le fond sombre (position: fixed)
  // du reste de l'écran, laissant apparaître le contenu derrière en clair.
  useEffect(() => {
    const scrollY = window.scrollY;
    const body = document.body;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      style={{ height: vh }}
      onClick={onCancel}
    >
      <div
        className="bg-surface-gradient border border-[#272d32] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 overflow-y-auto shadow-lift animate-scale-in"
        style={{ maxHeight: vh * 0.85 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span className="text-[#2b7fff]">{icon}</span>
            {title}
          </h2>
          <button onClick={onCancel} className="text-[#929ba2] hover:text-white p-1" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
