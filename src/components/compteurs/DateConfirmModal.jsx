import { useState } from "react";
import { Gauge } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";

// Un appui = une date à confirmer, rien d'autre.
export default function DateConfirmModal({ onCancel, onConfirm }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <ModalShell onCancel={onCancel} title="Confirmer le relevé" icon={<Gauge size={17} />}>
      <Field label="Date du relevé">
        <input
          autoFocus
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="modal-input text-lg py-3"
          onKeyDown={(e) => e.key === "Enter" && onConfirm(date)}
        />
      </Field>
      <ModalActions onCancel={onCancel} onSave={() => onConfirm(date)} saveLabel="Confirmer" />
    </ModalShell>
  );
}
