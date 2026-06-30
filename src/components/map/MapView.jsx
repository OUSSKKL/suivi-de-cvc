import { useEffect, useRef, useState } from "react";
import { ChevronLeft, Map as MapIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import * as db from "../../lib/db";
import { geocodeSites, setGeocode } from "../../utils/geocode";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";
import { addDarkTiles } from "./darkTiles";

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
  const mapInstance = useRef(null);
  const markersRef = useRef(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Dernier relevé par site → couleur du point.
      const lastBySite = {};
      try {
        const all = await db.listAllReleves();
        for (const r of all) {
          if (!lastBySite[r.siteId] || r.date > lastBySite[r.siteId]) lastBySite[r.siteId] = r.date;
        }
      } catch {
        /* on continue sans statut : tout sera "rouge" */
      }

      if (!mapInstance.current && mapRef.current) {
        mapInstance.current = L.map(mapRef.current).setView([48.8905, 2.37], 13);
        addDarkTiles(mapInstance.current);
        markersRef.current = L.layerGroup().addTo(mapInstance.current);
      }

      const coordsById = await geocodeSites(sites, (done, total) => {
        if (!cancelled) setProgress({ done, total });
      });
      if (cancelled) return;

      markersRef.current?.clearLayers();
      const bounds = [];
      let miss = 0;
      for (const site of sites) {
        const c = coordsById[site.id];
        if (!c) {
          miss++;
          continue;
        }
        const status = releveStatus(lastBySite[site.id]);
        const marker = L.marker([c.lat, c.lng], {
          draggable: true,
          icon: statusIcon(STATUS_COLORS[status]),
        })
          .bindPopup(`<b>${site.name}</b><br><span style="color:#888;font-size:11px">Glisse le point pour corriger</span>`)
          .addTo(markersRef.current);
        // Repositionnement : la nouvelle position est mémorisée (cache local).
        marker.on("dragend", () => {
          const p = marker.getLatLng();
          setGeocode(site.name, { lat: p.lat, lng: p.lng });
        });
        bounds.push([c.lat, c.lng]);
      }
      if (bounds.length) mapInstance.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      if (!cancelled) {
        setMissing(miss);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sites]);

  useEffect(() => {
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-6 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
            <MapIcon size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Carte des sites</h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-[#929ba2]">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.green }} />OK</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.orange }} />15j+</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.red }} />30j+</span>
        </div>
      </div>

      {!loading && (
        <p className="text-[#929ba2] text-xs mb-3">
          Glisse un point pour corriger l'emplacement d'un site (mémorisé automatiquement).
        </p>
      )}

      {loading && (
        <p className="text-[#929ba2] text-sm mb-3">
          Localisation des adresses… {progress.done}/{progress.total}
          {progress.done < progress.total ? " (première fois, ça peut prendre un moment)" : ""}
        </p>
      )}

      <div
        ref={mapRef}
        className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0"
        style={{ height: "70vh" }}
      />

      {!loading && missing > 0 && (
        <p className="text-[#929ba2] text-xs mt-3">
          {missing} adresse{missing > 1 ? "s" : ""} non localisée{missing > 1 ? "s" : ""} (introuvable{missing > 1 ? "s" : ""} sur la carte).
        </p>
      )}
    </div>
  );
}
