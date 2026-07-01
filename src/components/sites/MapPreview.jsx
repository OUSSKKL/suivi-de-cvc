import { useEffect, useRef } from "react";
import { Map as MapIcon } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { releveStatus, STATUS_COLORS } from "../../utils/releveStatus";
import { getAllSiteCoords } from "../../utils/siteLocations";
import { addDarkTiles } from "../map/darkTiles";

function statusIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid #0c0e10;box-shadow:0 0 0 1.5px ${color}"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// Mini-carte non interactive : un aperçu des sites géolocalisés.
// Un clic ouvre la vraie carte (onOpen).
export default function MapPreview({ sites, lastBySite, onOpen }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);

  const coords = getAllSiteCoords();
  const placed = sites.filter((s) => coords[(s.name || "").trim().toUpperCase()]);

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

    const bounds = [];
    for (const site of placed) {
      const c = coords[(site.name || "").trim().toUpperCase()];
      const status = releveStatus(lastBySite?.[site.id]);
      L.marker([c.lat, c.lng], { icon: statusIcon(STATUS_COLORS[status]), interactive: false }).addTo(map);
      bounds.push([c.lat, c.lng]);
    }
    if (bounds.length) map.fitBounds(bounds, { padding: [26, 26], maxZoom: 14 });

    return () => {
      map.remove();
      mapInst.current = null;
    };
  }, [sites, lastBySite]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <button
      onClick={onOpen}
      className="relative block w-full rounded-xl border border-[#272d32] overflow-hidden mb-4 group"
      style={{ height: 160 }}
      aria-label="Ouvrir la carte des sites"
    >
      <div ref={mapRef} className="absolute inset-0 z-0 pointer-events-none" />
      <div className="absolute inset-0 z-10 flex items-end justify-end p-2.5 pointer-events-none">
        <span className="flex items-center gap-1.5 bg-[#0c0e10]/80 backdrop-blur border border-[#272d32] text-[#2b7fff] text-xs font-semibold px-2.5 py-1.5 rounded-lg">
          <MapIcon size={13} />
          Ouvrir la carte
        </span>
      </div>
    </button>
  );
}
