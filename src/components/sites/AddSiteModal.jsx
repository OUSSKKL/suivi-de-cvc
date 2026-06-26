import { Building2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";

export default function AddSiteModal({ name, address, setName, setAddress, onCancel, onSave }) {
  return (
    <ModalShell onCancel={onCancel} title="Nouveau site" icon={<Building2 size={17} />}>
      <div className="space-y-3">
        <Field label="Nom du bâtiment *">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex : Résidence Les Tilleuls"
            className="modal-input"
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
        </Field>
        <Field label="Adresse">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Ex : 12 rue des Acacias, Lyon"
            className="modal-input"
            onKeyDown={(e) => e.key === "Enter" && onSave()}
          />
        </Field>
      </div>
      <ModalActions onCancel={onCancel} onSave={onSave} disabled={!name.trim()} saveLabel="Créer le site" />
    </ModalShell>
  );
}
