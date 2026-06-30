import { useState, useRef, useEffect } from "react";
import { MapPin, Check } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ModalShell from "../shared/ModalShell";
import { geocodeAddress } from "../../utils/geocode";
import { getSiteCoord, setSiteCoord } from "../../utils/siteLocations";
import { addDarkTiles } from "./darkTiles";

const PIN_ICON = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2b7fff;border:3px solid #fff;box-shadow:0 0 0 1.5px #0c0e10"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const CENTER = { lat: 48.8905, lng: 2.37 }; // 18e/19e par défaut

// Assistant : passe en revue les sites NON encore placés et les fait valider
// un par un (mini-carte + point déplaçable).
export default function MapAddWizard({ sites, onClose }) {
  const queue = useRef(sites.filter((s) => !getSiteCoord(s.name)));
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [placed, setPlaced] = useState(0);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerInst = useRef(null);

  const total = queue.current.length;
  const site = queue.current[index];
  const finished = index >= total;

  // Initialise la mini-carte une seule fois.
  useEffect(() => {
    if (finished || !mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { attributionControl: false }).setView([CENTER.lat, CENTER.lng], 15);
    addDarkTiles(mapInst.current);
    markerInst.current = L.marker([CENTER.lat, CENTER.lng], { draggable: true, icon: PIN_ICON }).addTo(mapInst.current);
    markerInst.current.on("dragend", () => {
      const p = markerInst.current.getLatLng();
      setCoords({ lat: p.lat, lng: p.lng });
    });
    setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 120);
    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [finished]);

  // Géocode le site courant à chaque changement d'index.
  useEffect(() => {
    if (!site) return;
    let cancelled = false;
    setBusy(true);
    setNotFound(false);
    (async () => {
      let c = null;
      try {
        c = await geocodeAddress(site.name);
      } catch {
        c = null;
      }
      if (cancelled) return;
      if (!c) {
        c = { ...CENTER };
        setNotFound(true);
      }
      setCoords(c);
      if (mapInst.current && markerInst.current) {
        mapInst.current.setView([c.lat, c.lng], 16);
        markerInst.current.setLatLng([c.lat, c.lng]);
        setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 60);
      }
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  function valider() {
    if (coords && site) {
      setSiteCoord(site.name, coords);
      setPlaced((n) => n + 1);
    }
    setIndex((i) => i + 1);
  }
  function passer() {
    setIndex((i) => i + 1);
  }

  if (total === 0) {
    return (
      <ModalShell onCancel={onClose} title="Placer les sites" icon={<MapPin size={17} />}>
        <p className="text-[#c2c8cd] text-sm">Tous tes sites sont déjà placés sur la carte. 👍</p>
        <button onClick={onClose} className="btn-accent w-full mt-4 py-2.5 rounded-lg font-semibold text-sm">
          OK
        </button>
      </ModalShell>
    );
  }

  if (finished) {
    return (
      <ModalShell onCancel={onClose} title="Terminé" icon={<Check size={17} />}>
        <p className="text-[#c2c8cd] text-sm">
          {placed} site{placed !== 1 ? "s" : ""} placé{placed !== 1 ? "s" : ""} sur la carte.
        </p>
        <button onClick={onClose} className="btn-accent w-full mt-4 py-2.5 rounded-lg font-semibold text-sm">
          Voir la carte
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onCancel={onClose} title={`Placer les sites — ${index + 1}/${total}`} icon={<MapPin size={17} />}>
      <p className="text-white text-sm font-semibold uppercase mb-1">{site.name}</p>
      <p className="text-[#929ba2] text-xs mb-3">
        {busy
          ? "Recherche de l'adresse…"
          : notFound
          ? "Adresse non trouvée : place le point au bon endroit."
          : "Vérifie l'emplacement, ajuste le point si besoin, puis valide."}
      </p>
      <div ref={mapRef} className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0" style={{ height: 240 }} />
      <div className="flex gap-2 mt-4">
        <button
          onClick={passer}
          className="py-2.5 px-4 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
        >
          Passer
        </button>
        <button
          onClick={valider}
          disabled={busy}
          className="btn-accent flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Check size={15} />
          Valider l'emplacement
        </button>
      </div>
      <button onClick={onClose} className="w-full text-center text-[#7d868d] hover:text-[#c2c8cd] text-xs mt-3">
        Arrêter pour l'instant
      </button>
    </ModalShell>
  );
}
