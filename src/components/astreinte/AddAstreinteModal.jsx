import { useState } from "react";
import { Clock } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";
import { durationHours, formatDuration } from "../../utils/duration";

export default function AddAstreinteModal({ onCancel, onSave }) {
  const [address, setAddress] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="modal-input"
          />
        </Field>

        <div className="flex gap-3">
          <Field label="Heure de début" className="flex-1">
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="modal-input"
            />
          </Field>
          <Field label="Heure de fin" className="flex-1">
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="modal-input"
            />
          </Field>
        </div>

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
