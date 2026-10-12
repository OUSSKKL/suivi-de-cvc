import { useState } from "react";
import { Clock } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";
import { durationHours, formatDuration } from "../../utils/duration";
import { formatDateJMA, todayISO } from "../../lib/format";
import WheelTimePicker, { nowHHMM } from "../shared/WheelTimePicker";

export default function AddAstreinteModal({ onCancel, onSave }) {
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(todayISO());
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [picking, setPicking] = useState(null); // "start" | "end" | null : sélecteur d'heure ouvert

  // Changer le début : si la fin n'a pas encore été modifiée (vide ou
  // identique à l'ancien début), elle suit le début.
  function changeStart(v) {
    if (!endTime || endTime === startTime) setEndTime(v);
    setStartTime(v);
  }

  // Ouvre la roue ; si l'heure est vide, on part de l'heure actuelle.
  function openPicker(key) {
    if (picking === key) return setPicking(null);
    if (key === "start" && !startTime) setStartTime(nowHHMM());
    // La fin démarre sur l'heure de début : il suffit d'avancer la roue.
    if (key === "end" && !endTime) setEndTime(startTime || nowHHMM());
    setPicking(key);
  }

  const canSave = address.trim() && date && startTime && endTime;
  const preview = startTime && endTime ? formatDuration(durationHours(startTime, endTime)) : null;

  function save() {
    if (!canSave) return;
    onSave({ address: address.trim(), date, startTime, endTime });
  }

  return (
    <ModalShell onCancel={onCancel} title="Nouvelle intervention" icon={<Clock size={17} />}>
      <div className="space-y-3">
        <Field label="Adresse de l'intervention">
          <input
            autoFocus
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex : 14 rue Victor Hugo, Lille"
            className="modal-input"
          />
        </Field>

        <Field label="Date">
          {/* Affichage toujours en jour/mois/année (quelle que soit la langue du
              navigateur) ; le sélecteur natif reste invisible par-dessus. */}
          <div className="relative">
            <div className="modal-input tabular-nums pointer-events-none">
              {date ? formatDateJMA(date) : <span className="text-[#7d868d]">JJ/MM/AAAA</span>}
            </div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              aria-label="Date (jour/mois/année)"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        </Field>

        <div className="flex gap-3">
          {[
            { key: "start", label: "Heure de début", value: startTime },
            { key: "end", label: "Heure de fin", value: endTime },
          ].map((f) => (
            <div key={f.key} className="flex-1">
              <span className="block text-xs font-medium text-[#c2c8cd] mb-1.5">{f.label}</span>
              <button
                type="button"
                onClick={() => openPicker(f.key)}
                className={`modal-input w-full text-left tabular-nums ${picking === f.key ? "!border-[#2b7fff]" : ""}`}
              >
                {f.value || <span className="text-[#7d868d]">--:--</span>}
              </button>
            </div>
          ))}
        </div>

        {/* Roue d'heure : après le début (OK), on passe directement à la fin. */}
        {picking && (
          <WheelTimePicker
            key={picking}
            title={picking === "start" ? "Heure de début" : "Heure de fin"}
            value={picking === "start" ? startTime : endTime}
            onChange={picking === "start" ? changeStart : setEndTime}
            onDone={() => (picking === "start" ? openPicker("end") : setPicking(null))}
          />
        )}

        {preview && (
          <p className="text-sm text-[#aab3ba]">
            Durée : <span className="font-semibold text-[#2b7fff]">{preview}</span>
          </p>
        )}
      </div>

      <ModalActions onCancel={onCancel} onSave={save} disabled={!canSave} saveLabel="Enregistrer" />
    </ModalShell>
  );
}
