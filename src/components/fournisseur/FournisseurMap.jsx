import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addDarkTiles } from "../map/darkTiles";

const DEFAULT_COLOR = "#7d868d";

// Pastille colorée (une couleur par fournisseur).
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #0c0e10;box-shadow:0 0 0 1.5px ${color}"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Popup : nom du fournisseur + adresse de l'agence + bouton Itinéraire Waze.
function buildPopup(name, adresse, color) {
  const icoNav =
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';
  const el = document.createElement("div");
  el.innerHTML =
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">` +
    `<span style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${color}33;flex:none"></span>` +
    `<span style="font-weight:700;font-size:13px;color:#fff;letter-spacing:.2px">${name}</span>` +
    `</div>` +
    `<div style="color:#9aa3a9;font-size:11.5px;margin-bottom:11px">${adresse || ""}</div>` +
    `<div style="display:flex;gap:7px">` +
    `<button class="pp-btn pp-waze">${icoNav}<span>Itinéraire</span></button>` +
    `</div>`;
  el.querySelector(".pp-waze").addEventListener("click", () => {
    window.location.href = `https://waze.com/ul?q=${encodeURIComponent(adresse)}&navigate=yes`;
  });
  return el;
}

// Toutes les agences géolocalisées, à plat : { name, color, adresse, coord }.
function flatten(fournisseurs) {
  const out = [];
  for (const f of fournisseurs) {
    const locs = f.locations || (f.coord ? [{ adresse: f.adresse, coord: f.coord }] : []);
    for (const l of locs) {
      if (l.coord) out.push({ name: f.name, color: f.color || DEFAULT_COLOR, adresse: l.adresse, coord: l.coord });
    }
  }
  return out;
}

// Carte interactive des fournisseurs géolocalisés : une couleur par
// fournisseur, toutes ses agences affichées, + légende.
export default function FournisseurMap({ fournisseurs }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);

  const points = flatten(fournisseurs);
  const legend = fournisseurs.filter((f) => (f.locations && f.locations.length) || f.coord);

  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;
    const map = L.map(mapRef.current, { attributionControl: false }).setView([48.89, 2.37], 12);
    mapInst.current = map;
    addDarkTiles(map);

    const bounds = [];
    for (const p of points) {
      const marker = L.marker([p.coord.lat, p.coord.lng], { icon: pinIcon(p.color) }).addTo(map);
      marker.bindPopup(buildPopup(p.name, p.adresse, p.color), { className: "site-popup", minWidth: 190, offset: [0, -4] });
      bounds.push([p.coord.lat, p.coord.lng]);
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!points.length) return null;

  return (
    <div className="mb-4">
      <div
        ref={mapRef}
        className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0"
        style={{ height: 260 }}
      />
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5 px-1">
        {legend.map((f) => (
          <span key={f.name} className="flex items-center gap-1.5 text-xs text-[#aab3ba]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ background: f.color || DEFAULT_COLOR }}
            />
            {f.name}
            {f.locations && f.locations.length > 1 && (
              <span className="text-[#7d868d]">({f.locations.length})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
