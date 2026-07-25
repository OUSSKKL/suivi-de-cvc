import { useState, useRef } from "react";
import { Waves, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";

export default function AddPotBoueModal({ item, onCancel, onSave }) {
  const [modele, setModele] = useState(item?.modele || "");
  const [photo, setPhoto] = useState(item?.photo || "");
  const [photoFile, setPhotoFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const canSave = modele.trim();

  // Verrou anti double-clic : tant que l'enregistrement est en cours, les
  // clics/Entrée suivants sont ignorés (sinon 2 fiches identiques).
  async function save() {
    if (busy || !canSave) return;
    setBusy(true);
    try {
      await onSave({ id: item?.id, modele, photo, photoFile });
    } finally {
      setBusy(false);
    }
  }

  function handlePhoto(e) {
    const file = (e.target.files || [])[0];
    if (!file) return;
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
  }

  function removePhoto() {
    setPhoto("");
    setPhotoFile(null);
  }

  return (
    <ModalShell onCancel={onCancel} title={item ? "Modifier le pot à boue" : "Nouveau pot à boue"} icon={<Waves size={17} />}>
      <div className="space-y-3">
        <Field label="Modèle">
          <input
            value={modele}
            onChange={(e) => setModele(e.target.value)}
            placeholder="Ex : Spirovent Dirtcal"
            className="modal-input"
            onKeyDown={(e) => e.key === "Enter" && save()}
          />
        </Field>

        <Field label="Photo de la plaque signalétique">
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Plaque signalétique" className="w-full max-h-48 object-contain rounded-lg border border-[#3a4147] bg-[#0c0e10]" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-2 right-2 bg-[#0c0e10]/80 text-[#ff8a8a] p-1.5 rounded-lg border border-[#3a4147]"
                aria-label="Retirer la photo"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-white text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
              >
                <Camera size={15} className="text-[#2b7fff]" />
                Prendre
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-white text-sm font-medium px-3 py-2.5 rounded-lg transition-colors"
              >
                <ImageIcon size={15} className="text-[#2b7fff]" />
                Galerie
              </button>
            </div>
          )}
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} className="hidden" />
          <input ref={galleryRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
        </Field>
      </div>
      <ModalActions
        onCancel={onCancel}
        onSave={save}
        disabled={!canSave || busy}
        saveLabel={busy ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter"}
      />
    </ModalShell>
  );
}
