import { useState, useRef } from "react";
import { Flame, Camera, Image as ImageIcon, Trash2 } from "lucide-react";
import { MARQUES, MODELES_PAR_MARQUE } from "../../data/constants";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";

export default function AddChaudiereModal({ item, onCancel, onSave }) {
  const [marque, setMarque] = useState(item?.marque || "");
  const [modele, setModele] = useState(item?.modele || "");
  const [photo, setPhoto] = useState(item?.photo || "");
  const [photoFile, setPhotoFile] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const canSave = marque.trim() || modele.trim();

  // Modèles proposés selon la marque saisie (correspondance souple).
  const marqueKey = MARQUES.find(
    (m) => m.toLowerCase() === marque.trim().toLowerCase()
  );
  const modelesProposes = marqueKey ? MODELES_PAR_MARQUE[marqueKey] : [];

  function pickMarque(m) {
    setMarque(m);
    setModele(""); // on repart à zéro sur le modèle quand on change de marque
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
    <ModalShell onCancel={onCancel} title={item ? "Modifier la chaudière" : "Nouvelle chaudière"} icon={<Flame size={17} />}>
      <div className="space-y-3">
        <Field label="Marque">
          <div className="flex gap-1.5 mb-2">
            {MARQUES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => pickMarque(m)}
                className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  marqueKey === m
                    ? "bg-[#2b7fff] text-[#ffffff] border-[#2b7fff]"
                    : "bg-[#1a1f23] text-[#e4e7ea] border-[#3a4147] hover:bg-[#272d32]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <input
            value={marque}
            onChange={(e) => setMarque(e.target.value)}
            placeholder="Ou tape une autre marque…"
            className="modal-input"
          />
        </Field>

        <Field label="Modèle">
          <input
            value={modele}
            onChange={(e) => setModele(e.target.value)}
            placeholder={modelesProposes.length ? "Choisis ou tape un modèle…" : "Ex : Vitodens 200-W"}
            className="modal-input"
            list="modeles-list"
            onKeyDown={(e) => e.key === "Enter" && canSave && onSave({ id: item?.id, marque, modele, photo, photoFile })}
          />
          <datalist id="modeles-list">
            {modelesProposes.map((m) => (
              <option key={m} value={m} />
            ))}
          </datalist>
          {modelesProposes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {modelesProposes.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModele(m)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                    modele === m
                      ? "bg-[#2b7fff] text-[#ffffff] border-[#2b7fff]"
                      : "bg-[#1a1f23] text-[#c2c8cd] border-[#272d32] hover:bg-[#272d32]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
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
        onSave={() => onSave({ id: item?.id, marque, modele, photo, photoFile })}
        disabled={!canSave}
        saveLabel={item ? "Enregistrer" : "Ajouter"}
      />
    </ModalShell>
  );
}
