import { useState, useRef, useEffect } from "react";
import { Building2, MapPin, ChevronLeft } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";
import { geocodeAddress } from "../../utils/geocode";

const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

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

  const initialCoords = useRef(null);
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerInst = useRef(null);

  async function goToConfirm() {
    if (!name.trim()) return;
    setBusy(true);
    setNotFound(false);
    let c = null;
    try {
      c = await geocodeAddress(name);
    } catch {
      c = null;
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
    L.tileLayer(DARK_TILES, { subdomains: "abcd", maxZoom: 20 }).addTo(mapInst.current);
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
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.toUpperCase())}
              placeholder="Ex : 12 rue des Acacias, Lyon"
              className="modal-input uppercase placeholder:normal-case"
              onKeyDown={(e) => e.key === "Enter" && name.trim() && (withLocation ? goToConfirm() : onSave(name))}
            />
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
