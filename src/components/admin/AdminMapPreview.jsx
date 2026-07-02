import { useEffect, useRef, useState } from "react";
import { Maximize2, X, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addDarkTiles } from "../map/darkTiles";
import { daysSince } from "../../utils/releveStatus";

function dot(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2px solid #0c0e10;box-shadow:0 0 0 1.5px ${color}"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

function lastReleveText(lastDate) {
  if (!lastDate) return "Aucun relevé";
  const d = daysSince(lastDate);
  if (d <= 0) return "Relevé aujourd'hui";
  if (d === 1) return "Relevé hier";
  return `Dernier relevé il y a ${d} j`;
}

// Bascule couleur "Par technicien / Par relevé".
function ColorToggle({ colorMode, onColorMode, onClick }) {
  return (
    <div className="flex gap-1 p-1 rounded-lg bg-[#15191c]/90 backdrop-blur border border-[#272d32] shadow-lift">
      {[
        { id: "tech", label: "Par technicien" },
        { id: "releve", label: "Par relevé" },
      ].map((m) => (
        <button
          key={m.id}
          onClick={(e) => {
            e.stopPropagation();
            onColorMode(m.id);
          }}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
            colorMode === m.id ? "bg-[#2b7fff]/15 text-[#2b7fff]" : "text-[#c2c8cd] hover:bg-[#1a1f23]"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

// Petit aperçu NON interactif (ne capture ni le zoom ni le scroll de la page).
// Un clic ouvre la carte en plein écran, où l'on peut zoomer et toucher un
// site pour voir son nom et son dernier relevé.
export default function AdminMapPreview({ points, colorMode, onColorMode }) {
  const [open, setOpen] = useState(false);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layer = useRef(null);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, {
      attributionControl: false,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      touchZoom: false,
    }).setView([48.8905, 2.37], 12);
    mapInst.current = map;
    addDarkTiles(map);
    layer.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInst.current || !layer.current) return;
    layer.current.clearLayers();
    const bounds = [];
    for (const p of points) {
      L.marker([p.lat, p.lng], { icon: dot(p.color), interactive: false }).addTo(layer.current);
      bounds.push([p.lat, p.lng]);
    }
    if (bounds.length) mapInst.current.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    else mapInst.current.setView([48.8905, 2.37], 12);
    setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 60);
  }, [points]);

  return (
    <>
      <div
        onClick={() => points.length && setOpen(true)}
        role="button"
        className="relative w-full rounded-xl border border-[#272d32] overflow-hidden mb-4 z-0 cursor-pointer"
        style={{ height: 180 }}
        aria-label="Agrandir la carte"
      >
        {/* La carte ne capture pas les gestes : le clic ouvre le plein écran. */}
        <div ref={mapRef} className="absolute inset-0 pointer-events-none" />

        {/* Bascule couleur (si dispo) */}
        {onColorMode && points.length > 0 && (
          <div className="absolute top-2.5 left-2.5 z-10">
            <ColorToggle colorMode={colorMode} onColorMode={onColorMode} />
          </div>
        )}

        {points.length === 0 ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0c0e10]/70 backdrop-blur-[1px]">
            <p className="text-[#7d868d] text-xs font-medium">Aucun site placé sur la carte</p>
          </div>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 bg-[#0c0e10]/80 backdrop-blur border border-[#272d32] text-[#2b7fff] text-xs font-semibold px-2.5 py-1.5 rounded-lg pointer-events-none">
            <Maximize2 size={13} />
            Agrandir
          </span>
        )}
      </div>

      {open && (
        <FullMap points={points} colorMode={colorMode} onColorMode={onColorMode} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

// Carte plein écran interactive : zoom + points cliquables (nom + dernier relevé).
// La bascule couleur (par technicien / par relevé) est en haut, si fournie.
function FullMap({ points, colorMode, onColorMode, onClose }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const layer = useRef(null);
  const fitted = useRef(false);
  const lastBounds = useRef([]);

  function recenter() {
    if (mapInst.current && lastBounds.current.length) {
      mapInst.current.fitBounds(lastBounds.current, { padding: [40, 40], maxZoom: 16 });
    }
  }

  // Init une seule fois.
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { attributionControl: false }).setView([48.8905, 2.37], 13);
    mapInst.current = map;
    addDarkTiles(map);
    layer.current = L.layerGroup().addTo(map);
    setTimeout(() => map.invalidateSize(), 80);
    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []);

  // (Re)dessine les marqueurs quand les points/couleurs changent.
  useEffect(() => {
    if (!mapInst.current || !layer.current) return;
    layer.current.clearLayers();
    const bounds = [];
    for (const p of points) {
      const marker = L.marker([p.lat, p.lng], { icon: dot(p.color) }).addTo(layer.current);
      marker.bindPopup(
        `<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">` +
          `<span style="width:9px;height:9px;border-radius:50%;background:${p.color};box-shadow:0 0 0 3px ${p.color}33;flex:none"></span>` +
          `<span style="font-weight:700;font-size:13px;color:#fff;letter-spacing:.2px">${p.name}</span>` +
          `</div>` +
          `<div style="color:#9aa3a9;font-size:11.5px">${lastReleveText(p.last)}</div>`,
        { className: "site-popup", minWidth: 180, offset: [0, -4] }
      );
      bounds.push([p.lat, p.lng]);
    }
    lastBounds.current = bounds;
    // Recentrage AUTOMATIQUE à l'ouverture (une seule fois, pas à chaque
    // changement de couleur). Léger délai + invalidateSize pour que le cadrage
    // tienne compte de la vraie taille de la carte plein écran.
    if (bounds.length && !fitted.current) {
      fitted.current = true;
      setTimeout(() => {
        if (!mapInst.current) return;
        mapInst.current.invalidateSize();
        mapInst.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      }, 120);
    }
  }, [points]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0e10] animate-fade-in">
      <div ref={mapRef} className="absolute inset-0 z-0" />

      {/* Bascule couleur en haut (si dispo) */}
      {onColorMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <ColorToggle colorMode={colorMode} onColorMode={onColorMode} />
        </div>
      )}

      {/* Recentrer */}
      <button
        onClick={recenter}
        className="absolute bottom-5 right-4 z-10 flex items-center gap-1.5 bg-[#15191c]/90 backdrop-blur border border-[#272d32] text-[#c2c8cd] hover:text-white hover:bg-[#1a1f23] text-sm font-semibold px-3.5 py-2.5 rounded-lg transition-colors shadow-lift"
      >
        <Crosshair size={16} />
        Recentrer
      </button>

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-[#15191c]/90 backdrop-blur border border-[#272d32] text-white hover:bg-[#1a1f23] transition-colors shadow-lift"
        aria-label="Fermer la carte"
      >
        <X size={20} />
      </button>
    </div>
  );
}
