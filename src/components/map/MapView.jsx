import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Map as MapIcon, Plus } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as db from "../../lib/db";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";
import { getAllSiteCoords, setSiteCoord } from "../../utils/siteLocations";
import { addDarkTiles } from "./darkTiles";
import MapAddWizard from "./MapAddWizard";

// Pastille colorée déplaçable (divIcon = pas de souci d'image sous Vite).
function statusIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;border-radius:50%;background:${color};border:2px solid #0c0e10;box-shadow:0 0 0 1.5px ${color}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

export default function MapView({ sites, onBack }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markers = useRef(null);
  const lastBySite = useRef({});
  const [placed, setPlaced] = useState(0);
  const [wizard, setWizard] = useState(false);

  function renderMarkers() {
    if (!markers.current || !mapInst.current) return;
    markers.current.clearLayers();
    const coords = getAllSiteCoords();
    const bounds = [];
    for (const site of sites) {
      const c = coords[(site.name || "").trim().toUpperCase()];
      if (!c) continue;
      const status = releveStatus(lastBySite.current[site.id]);
      const marker = L.marker([c.lat, c.lng], { draggable: true, icon: statusIcon(STATUS_COLORS[status]) })
        .bindPopup(`<b>${site.name}</b><br><span style="color:#888;font-size:11px">Glisse pour corriger</span>`)
        .addTo(markers.current);
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setSiteCoord(site.name, { lat: p.lat, lng: p.lng });
      });
      bounds.push([c.lat, c.lng]);
    }
    setPlaced(bounds.length);
    if (bounds.length) mapInst.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const all = await db.listAllReleves();
        const m = {};
        for (const r of all) if (!m[r.siteId] || r.date > m[r.siteId]) m[r.siteId] = r.date;
        lastBySite.current = m;
      } catch {
        /* sans statut : tout en rouge */
      }
      if (cancelled || !mapRef.current) return;
      if (!mapInst.current) {
        mapInst.current = L.map(mapRef.current).setView([48.8905, 2.37], 13);
        addDarkTiles(mapInst.current);
        markers.current = L.layerGroup().addTo(mapInst.current);
      }
      renderMarkers();
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, []);

  function closeWizard() {
    setWizard(false);
    renderMarkers();
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-6 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
            <MapIcon size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Carte des sites</h1>
        </div>
        <button
          onClick={() => setWizard(true)}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          Ajouter
        </button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-[#929ba2] text-xs">
          {placed > 0
            ? "Glisse un point pour corriger l'emplacement."
            : "Aucun site placé. Appuie sur « Ajouter » pour les positionner un par un."}
        </p>
        <div className="flex items-center gap-3 text-xs text-[#929ba2] shrink-0">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.green }} />OK</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.orange }} />15j+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.red }} />30j+</span>
        </div>
      </div>

      <div
        ref={mapRef}
        className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0"
        style={{ height: "70vh" }}
      />

      {wizard && <MapAddWizard sites={sites} onClose={closeWizard} />}
    </div>
  );
}
