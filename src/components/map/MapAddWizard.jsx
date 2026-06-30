import { useState, useRef, useEffect } from "react";
import { MapPin, Check } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ModalShell from "../shared/ModalShell";
import { geocodeCandidates } from "../../utils/geocode";
import { getSiteCoord, setSiteCoord } from "../../utils/siteLocations";
import { addDarkTiles } from "./darkTiles";

const PIN_ICON = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2b7fff;border:3px solid #fff;box-shadow:0 0 0 1.5px #0c0e10"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const CENTER = { lat: 48.8905, lng: 2.37 }; // 18e/19e par défaut

// Raccourcit le libellé Nominatim (garde le début, sans le pays/région).
function shortLabel(label) {
  return (label || "").split(",").slice(0, 3).join(", ").trim();
}

// Assistant : passe en revue les sites NON encore placés et les fait valider
// un par un (propositions d'adresses + mini-carte avec point déplaçable).
export default function MapAddWizard({ sites, onClose }) {
  const queue = useRef(sites.filter((s) => !getSiteCoord(s.name)));
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [selected, setSelected] = useState(0);
  const [coords, setCoords] = useState(null);
  const [placed, setPlaced] = useState(0);

  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerInst = useRef(null);

  const total = queue.current.length;
  const site = queue.current[index];
  const finished = index >= total;

  function moveTo(c) {
    setCoords(c);
    if (mapInst.current && markerInst.current) {
      mapInst.current.setView([c.lat, c.lng], 17);
      markerInst.current.setLatLng([c.lat, c.lng]);
      setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 60);
    }
  }

  // Initialise la mini-carte une seule fois.
  useEffect(() => {
    if (finished || !mapRef.current || mapInst.current) return;
    mapInst.current = L.map(mapRef.current, { attributionControl: false }).setView([CENTER.lat, CENTER.lng], 15);
    addDarkTiles(mapInst.current);
    markerInst.current = L.marker([CENTER.lat, CENTER.lng], { draggable: true, icon: PIN_ICON }).addTo(mapInst.current);
    markerInst.current.on("dragend", () => {
      const p = markerInst.current.getLatLng();
      setCoords({ lat: p.lat, lng: p.lng });
      setSelected(-1); // position ajustée à la main
    });
    setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 120);
    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [finished]);

  // Cherche les propositions du site courant à chaque changement d'index.
  useEffect(() => {
    if (!site) return;
    let cancelled = false;
    setBusy(true);
    setCandidates([]);
    (async () => {
      let list = [];
      try {
        list = await geocodeCandidates(site.name, 5);
      } catch {
        list = [];
      }
      if (cancelled) return;
      setCandidates(list);
      if (list.length > 0) {
        setSelected(0);
        moveTo({ lat: list[0].lat, lng: list[0].lng });
      } else {
        setSelected(-1);
        moveTo({ ...CENTER });
      }
      setBusy(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [index]); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(i) {
    setSelected(i);
    moveTo({ lat: candidates[i].lat, lng: candidates[i].lng });
  }

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
        <button onClick={onClose} className="btn-accent w-full mt-4 py-2.5 rounded-lg font-semibold text-sm">OK</button>
      </ModalShell>
    );
  }

  if (finished) {
    return (
      <ModalShell onCancel={onClose} title="Terminé" icon={<Check size={17} />}>
        <p className="text-[#c2c8cd] text-sm">
          {placed} site{placed !== 1 ? "s" : ""} placé{placed !== 1 ? "s" : ""} sur la carte.
        </p>
        <button onClick={onClose} className="btn-accent w-full mt-4 py-2.5 rounded-lg font-semibold text-sm">Voir la carte</button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onCancel={onClose} title={`Placer les sites — ${index + 1}/${total}`} icon={<MapPin size={17} />}>
      <p className="text-white text-sm font-semibold uppercase mb-2">{site.name}</p>

      <div ref={mapRef} className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0 mb-3" style={{ height: 200 }} />

      <p className="text-[#929ba2] text-xs mb-2">
        {busy ? "Recherche d'adresses…" : candidates.length > 0 ? "Choisis la bonne adresse :" : "Aucune proposition — place le point à la main sur la carte."}
      </p>

      {candidates.length > 0 && (
        <div className="space-y-1.5 max-h-44 overflow-y-auto mb-1">
          {candidates.map((c, i) => (
            <button
              key={i}
              onClick={() => pick(i)}
              className={`w-full text-left flex items-start gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                selected === i
                  ? "border-[#2b7fff] bg-[#2b7fff]/10 text-white"
                  : "border-[#272d32] bg-[#15191c] text-[#c2c8cd] hover:bg-[#1a1f23]"
              }`}
            >
              <MapPin size={14} className={`mt-0.5 shrink-0 ${selected === i ? "text-[#2b7fff]" : "text-[#7d868d]"}`} />
              <span className="min-w-0">{shortLabel(c.label)}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={passer}
          className="py-2.5 px-4 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
        >
          Passer
        </button>
        <button
          onClick={valider}
          disabled={busy || !coords}
          className="btn-accent flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          <Check size={15} />
          Valider
        </button>
      </div>
      <button onClick={onClose} className="w-full text-center text-[#7d868d] hover:text-[#c2c8cd] text-xs mt-3">
        Arrêter pour l'instant
      </button>
    </ModalShell>
  );
}
