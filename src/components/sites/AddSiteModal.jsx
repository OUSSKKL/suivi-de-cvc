import { useState, useRef, useEffect } from "react";
import { Building2, MapPin, ChevronLeft } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";
import { geocodeAddress, suggestAddresses } from "../../utils/geocode";
import { addDarkTiles } from "../map/darkTiles";

const PIN_ICON = L.divIcon({
  className: "",
  html: '<div style="width:18px;height:18px;border-radius:50%;background:#2b7fff;border:3px solid #fff;box-shadow:0 0 0 1.5px #0c0e10"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function AddSiteModal({ item, withLocation, onCancel, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [step, setStep] = useState("form"); // form | confirm
  const [busy, setBusy] = useState(false);
  const [coords, setCoords] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [openSug, setOpenSug] = useState(false);

  const initialCoords = useRef(null);
  const pickedCoords = useRef(null); // coord d'une suggestion choisie (évite un 2e géocodage)
  const justPicked = useRef(false);
  const debounceRef = useRef(null);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerInst = useRef(null);

  // Autocomplétion : propose de vraies adresses pendant la saisie.
  useEffect(() => {
    if (step !== "form") return;
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    pickedCoords.current = null; // la saisie a changé : on annule la coord choisie
    const q = name.trim();
    if (q.length < 3) {
      setSuggestions([]);
      setOpenSug(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await suggestAddresses(q, 5);
        setSuggestions(res);
        setOpenSug(res.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [name, step]);

  // Si OSM renvoie la rue sans numéro (ex "Boulevard Mortier"), on réinsère le
  // numéro saisi (ex "120 bv mortier" → "120 Boulevard Mortier").
  function withTypedNumber(label) {
    const l = (label || "").trim();
    const m = name.trim().match(/^\d+\s*(?:bis|ter|quater)?/i);
    return m && !/^\d/.test(l) ? `${m[0].trim()} ${l}` : l;
  }

  function pickSuggestion(s) {
    justPicked.current = true;
    setName(withTypedNumber(s.short || s.label).toUpperCase());
    pickedCoords.current = { lat: s.lat, lng: s.lng };
    setSuggestions([]);
    setOpenSug(false);
  }

  async function goToConfirm() {
    if (!name.trim()) return;
    setBusy(true);
    setNotFound(false);
    setOpenSug(false);
    let c = pickedCoords.current;
    if (!c) {
      try {
        c = await geocodeAddress(name);
      } catch {
        c = null;
      }
    }
    if (!c) {
      c = { lat: 48.8905, lng: 2.37 }; // centre 18e/19e par défaut, à déplacer
      setNotFound(true);
    }
    initialCoords.current = c;
    setCoords(c);
    setStep("confirm");
    setBusy(false);
  }

  // Initialise la mini-carte à l'entrée de l'étape de confirmation.
  useEffect(() => {
    if (step !== "confirm" || !initialCoords.current || !mapRef.current) return;
    if (mapInst.current) return;
    const start = initialCoords.current;
    mapInst.current = L.map(mapRef.current, { attributionControl: false }).setView([start.lat, start.lng], 16);
    addDarkTiles(mapInst.current);
    markerInst.current = L.marker([start.lat, start.lng], { draggable: true, icon: PIN_ICON }).addTo(mapInst.current);
    markerInst.current.on("dragend", () => {
      const p = markerInst.current.getLatLng();
      setCoords({ lat: p.lat, lng: p.lng });
    });
    // La modale s'anime à l'ouverture : on recalcule la taille après coup.
    setTimeout(() => mapInst.current && mapInst.current.invalidateSize(), 120);
    return () => {
      if (mapInst.current) {
        mapInst.current.remove();
        mapInst.current = null;
      }
    };
  }, [step]);

  const title = item ? "Modifier le site" : "Nouveau site";

  return (
    <ModalShell onCancel={onCancel} title={title} icon={<Building2 size={17} />}>
      {step === "form" && (
        <>
          <Field label="Adresse">
            <div className="relative">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value.toUpperCase())}
                placeholder="Ex : 12 rue des Acacias, Lyon"
                className="modal-input uppercase placeholder:normal-case"
                autoComplete="off"
                onKeyDown={(e) => e.key === "Enter" && name.trim() && (withLocation ? goToConfirm() : onSave(name))}
              />
              {openSug && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-[#15191c] border border-[#272d32] rounded-lg shadow-[0_12px_30px_-10px_rgba(0,0,0,0.7)] overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        pickSuggestion(s);
                      }}
                      className="w-full text-left flex items-start gap-2 px-3 py-2 text-sm text-[#c2c8cd] hover:bg-[#1a1f23] border-b border-[#1f2429] last:border-0 transition-colors"
                    >
                      <MapPin size={14} className="mt-0.5 shrink-0 text-[#7d868d]" />
                      <span className="min-w-0">{withTypedNumber(s.short || s.label)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Field>

          {withLocation ? (
            <div className="flex gap-2 mt-5">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={goToConfirm}
                disabled={!name.trim() || busy}
                className="btn-accent flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <MapPin size={15} />
                {busy ? "Localisation…" : "Localiser"}
              </button>
            </div>
          ) : (
            <ModalActions
              onCancel={onCancel}
              onSave={() => onSave(name)}
              disabled={!name.trim()}
              saveLabel="Enregistrer"
            />
          )}
        </>
      )}

      {step === "confirm" && (
        <>
          <p className="text-[#c2c8cd] text-sm font-semibold mb-1 uppercase">{name}</p>
          <p className="text-[#929ba2] text-xs mb-3">
            {notFound
              ? "Adresse non trouvée automatiquement : place le point au bon endroit."
              : "Vérifie l'emplacement. Tu peux déplacer le point si besoin."}
          </p>
          <div
            ref={mapRef}
            className="w-full rounded-xl border border-[#272d32] overflow-hidden z-0"
            style={{ height: 240 }}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setStep("form")}
              className="flex items-center justify-center gap-1 py-2.5 px-3 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
            >
              <ChevronLeft size={15} />
              Adresse
            </button>
            <button
              onClick={() => onSave(name, coords)}
              className="btn-accent flex-1 py-2.5 rounded-lg font-semibold text-sm"
            >
              Confirmer l'emplacement
            </button>
          </div>
        </>
      )}
    </ModalShell>
  );
}
