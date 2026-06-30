import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Map as MapIcon, Plus, Crosshair } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as db from "../../lib/db";
import { releveStatus, STATUS_COLORS, daysSince } from "../../utils/releveStatus";
import { getAllSiteCoords, setSiteCoord, removeSiteCoord } from "../../utils/siteLocations";
import { addDarkTiles } from "./darkTiles";
import MapAddWizard from "./MapAddWizard";

// Texte "ancienneté" du dernier relevé pour le popup.
function lastReleveText(lastDate) {
  if (!lastDate) return "Aucun relevé";
  const d = daysSince(lastDate);
  if (d <= 0) return "Relevé aujourd'hui";
  if (d === 1) return "Relevé hier";
  return `Dernier relevé il y a ${d} j`;
}

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
  const lastBounds = useRef([]);
  const [placed, setPlaced] = useState(0);
  const [counts, setCounts] = useState({ green: 0, orange: 0, red: 0 });
  const [filter, setFilter] = useState("all"); // "all" | "late" (orange+rouge) | "critical" (rouge)
  const [wizard, setWizard] = useState(false);

  // Contenu du popup (élément DOM pour pouvoir attacher les clics) :
  // en-tête avec pastille de statut + nom, ancienneté du relevé, puis les
  // boutons Itinéraire (Waze) et Supprimer de la carte.
  function buildPopup(site, marker, lastDate, status) {
    const color = STATUS_COLORS[status];
    const icoNav =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>';
    const icoTrash =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const icoClock =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';

    const el = document.createElement("div");
    el.innerHTML =
      `<div style="display:flex;align-items:center;gap:8px;margin-bottom:7px">` +
      `<span style="width:9px;height:9px;border-radius:50%;background:${color};box-shadow:0 0 0 3px ${color}33;flex:none"></span>` +
      `<span style="font-weight:700;font-size:13px;color:#fff;letter-spacing:.2px">${site.name}</span>` +
      `</div>` +
      `<div style="display:flex;align-items:center;gap:6px;color:#9aa3a9;font-size:11.5px;margin-bottom:11px">${icoClock}<span>${lastReleveText(lastDate)}</span></div>` +
      `<div style="display:flex;gap:7px">` +
      `<button class="pp-btn pp-waze">${icoNav}<span>Itinéraire</span></button>` +
      `<button class="pp-btn pp-del" title="Retirer de la carte">${icoTrash}</button>` +
      `</div>`;

    el.querySelector(".pp-waze").addEventListener("click", () => {
      const p = marker.getLatLng();
      window.open(`https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes`, "_blank");
    });
    el.querySelector(".pp-del").addEventListener("click", () => {
      removeSiteCoord(site.name);
      marker.closePopup();
      renderMarkers();
    });
    return el;
  }

  function renderMarkers(filterMode = filter) {
    if (!markers.current || !mapInst.current) return;
    markers.current.clearLayers();
    const coords = getAllSiteCoords();
    const bounds = [];
    const tally = { green: 0, orange: 0, red: 0 };
    const all = [];
    for (const site of sites) {
      const c = coords[(site.name || "").trim().toUpperCase()];
      if (!c) continue;
      const status = releveStatus(lastBySite.current[site.id]);
      tally[status]++;
      if (filterMode === "late" && status !== "orange") continue;
      if (filterMode === "critical" && status !== "red") continue;
      const marker = L.marker([c.lat, c.lng], { draggable: true, icon: statusIcon(STATUS_COLORS[status]) }).addTo(markers.current);
      marker.bindPopup(buildPopup(site, marker, lastBySite.current[site.id], status), {
        className: "site-popup",
        minWidth: 210,
        offset: [0, -4],
      });
      // Verrouillé par défaut : on ne peut déplacer un point qu'après avoir
      // cliqué dessus (sélection du site concerné).
      marker.dragging.disable();
      marker.on("click", () => {
        for (const mk of all) mk.dragging.disable();
        marker.dragging.enable();
      });
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setSiteCoord(site.name, { lat: p.lat, lng: p.lng });
      });
      all.push(marker);
      bounds.push([c.lat, c.lng]);
    }
    setPlaced(tally.green + tally.orange + tally.red);
    setCounts(tally);
    lastBounds.current = bounds;
    if (bounds.length) mapInst.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }

  function recenter() {
    if (mapInst.current && lastBounds.current.length) {
      mapInst.current.fitBounds(lastBounds.current, { padding: [40, 40], maxZoom: 16 });
    }
  }

  function applyFilter(mode) {
    setFilter(mode);
    renderMarkers(mode);
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
        mapInst.current = L.map(mapRef.current, { attributionControl: false }).setView([48.8905, 2.37], 13);
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

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          {[
            { mode: "all", label: "Tous", color: "#c2c8cd" },
            { mode: "late", label: "Retard", color: STATUS_COLORS.orange },
            { mode: "critical", label: "Critique", color: STATUS_COLORS.red },
          ].map((f) => (
            <button
              key={f.mode}
              onClick={() => applyFilter(f.mode)}
              disabled={placed === 0}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-40 ${
                filter === f.mode
                  ? "bg-white/5 text-white"
                  : "border-[#3a4147] text-[#c2c8cd] hover:bg-[#1a1f23]"
              }`}
              style={filter === f.mode ? { borderColor: f.color, color: f.color } : undefined}
            >
              {f.label}
            </button>
          ))}
          <button
            onClick={recenter}
            disabled={placed === 0}
            className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-[#3a4147] text-[#c2c8cd] hover:bg-[#1a1f23] transition-colors disabled:opacity-40"
          >
            <Crosshair size={13} />
            Recentrer
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#929ba2] shrink-0">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.green }} />{counts.green}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.orange }} />{counts.orange}</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.red }} />{counts.red}</span>
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
