import { useState } from "react";
import { Building2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";

export default function AddSiteModal({ item, onCancel, onSave }) {
  const [name, setName] = useState(item?.name || "");

  return (
    <ModalShell onCancel={onCancel} title={item ? "Modifier le site" : "Nouveau site"} icon={<Building2 size={17} />}>
      <Field label="Adresse">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : 12 rue des Acacias, Lyon"
          className="modal-input"
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name)}
        />
      </Field>
      <ModalActions
        onCancel={onCancel}
        onSave={() => onSave(name)}
        disabled={!name.trim()}
        saveLabel={item ? "Enregistrer" : "Créer le site"}
      />
    </ModalShell>
  );
}
