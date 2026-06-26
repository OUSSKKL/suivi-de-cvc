import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, X, Download, Trash2 } from "lucide-react";
import * as db from "../../lib/db";
import { formatDate } from "../../lib/format";
import { downloadImage } from "../../lib/download";
import EmptyState from "../shared/EmptyState";
import ModalShell from "../shared/ModalShell";
import Field from "../shared/Field";
import ModalActions from "../shared/ModalActions";
import ConfirmModal from "../shared/ConfirmModal";
import LoadingRow from "../shared/LoadingRow";

export default function PhotosTab({ siteId, showToast }) {
  const [items, setItems] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewing, setViewing] = useState(null);
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [pendingFiles, setPendingFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showCategoryChoice, setShowCategoryChoice] = useState(false);
  const [showSourceChoice, setShowSourceChoice] = useState(false);
  const [chosenCategory, setChosenCategory] = useState("");

  const CATEGORIES = [
    "Pompe charge chaudière",
    "Pompe charge ECS",
    "Pompe chauffage",
    "Pompe bouclage",
  ];

  useEffect(() => {
    (async () => {
      try {
        const data = await db.listPhotos(siteId);
        setItems(data);
      } catch (e) {
        showToast("⚠️ Impossible de charger les photos");
        setItems([]);
      }
    })();
  }, [siteId]);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setPendingFiles(files);
    // si une catégorie a été choisie, on pré-remplit l'étiquette
    if (chosenCategory) setPendingLabel(chosenCategory);
  }

  function resetInputs() {
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  async function confirmUpload() {
    if (!pendingFiles) return;
    const label = (pendingLabel.trim() || chosenCategory).trim();
    const date = new Date().toISOString().slice(0, 10);
    setUploading(true);
    try {
      const newPhotos = await Promise.all(
        pendingFiles.map(async (file) => {
          const url = await db.uploadImage(file, `photos/${siteId}`);
          return db.addPhoto(siteId, { label: label || file.name, url, date });
        })
      );
      setItems([...newPhotos, ...items]);
      showToast(newPhotos.length > 1 ? "Photos ajoutées" : "Photo ajoutée");
      setPendingFiles(null);
      setPendingLabel("");
      setChosenCategory("");
      resetInputs();
    } catch (e) {
      showToast("⚠️ Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto(id) {
    const photo = items.find((p) => p.id === id);
    try {
      await db.deletePhoto(id);
      if (photo?.url) db.removeImage(photo.url);
      setItems(items.filter((p) => p.id !== id));
      showToast("Photo supprimée");
    } catch (e) {
      showToast("⚠️ Erreur lors de la suppression");
    }
    setConfirmDel(null);
    if (viewing?.id === id) setViewing(null);
  }

  if (items === null) return <LoadingRow />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[#aab3ba] text-sm">
          {items.length} photo{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowCategoryChoice(true)}
          className="flex items-center gap-1.5 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-[#ffffff] font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
        >
          <Camera size={15} />
          Ajouter
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFiles}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFiles}
          className="hidden"
        />
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={Camera}
          title="Aucune photo"
          message="Choisis le type de pompe, puis prends la photo. Elle sera enregistrée avec le bon nom."
          action={() => setShowCategoryChoice(true)}
          actionLabel="Ajouter une photo"
        />
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {items.map((p) => (
          <button
            key={p.id}
            onClick={() => setViewing(p)}
            className="relative aspect-square rounded-lg overflow-hidden border border-[#272d32] group bg-[#15191c]"
          >
            <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1.5 text-left">
              <p className="text-white text-xs font-medium truncate">{p.label}</p>
            </div>
          </button>
        ))}
      </div>

      {showCategoryChoice && (
        <ModalShell
          onCancel={() => setShowCategoryChoice(false)}
          title="Type de photo"
          icon={<Camera size={17} />}
        >
          <p className="text-[#aab3ba] text-sm mb-3">Choisis ce que tu prends en photo :</p>
          <div className="space-y-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setChosenCategory(cat);
                  setShowCategoryChoice(false);
                  setShowSourceChoice(true);
                }}
                className="w-full flex items-center gap-3 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-white font-medium text-sm px-4 py-3.5 rounded-lg transition-colors text-left"
              >
                <Camera size={16} className="text-[#ff8a3d] shrink-0" />
                {cat}
              </button>
            ))}
          </div>
        </ModalShell>
      )}

      {showSourceChoice && (
        <ModalShell
          onCancel={() => {
            setShowSourceChoice(false);
            setChosenCategory("");
          }}
          title={chosenCategory || "Photo"}
          icon={<Camera size={17} />}
        >
          <p className="text-[#aab3ba] text-sm mb-3">Comment veux-tu ajouter la photo ?</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setShowSourceChoice(false);
                setTimeout(() => cameraInputRef.current?.click(), 50);
              }}
              className="w-full flex items-center gap-3 bg-[#ff8a3d] hover:bg-[#ff9d5c] text-[#1a1006] font-semibold text-sm px-4 py-3.5 rounded-lg transition-colors text-left"
            >
              <Camera size={17} className="shrink-0" />
              Prendre une photo
            </button>
            <button
              onClick={() => {
                setShowSourceChoice(false);
                setTimeout(() => galleryInputRef.current?.click(), 50);
              }}
              className="w-full flex items-center gap-3 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-white font-semibold text-sm px-4 py-3.5 rounded-lg transition-colors text-left"
            >
              <ImageIcon size={17} className="text-[#ff8a3d] shrink-0" />
              Choisir dans la galerie
            </button>
          </div>
        </ModalShell>
      )}

      {pendingFiles && (
        <ModalShell
          onCancel={() => {
            if (uploading) return;
            setPendingFiles(null);
            setPendingLabel("");
            setChosenCategory("");
            resetInputs();
          }}
          title={`${pendingFiles.length} photo${pendingFiles.length > 1 ? "s" : ""} sélectionnée${pendingFiles.length > 1 ? "s" : ""}`}
          icon={<ImageIcon size={17} />}
        >
          <div className="grid grid-cols-4 gap-2 mb-3">
            {pendingFiles.slice(0, 8).map((f, i) => (
              <div key={i} className="aspect-square rounded-md overflow-hidden bg-[#1a1f23] border border-[#3a4147]">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <Field label="Nom de la photo">
            <input
              autoFocus
              value={pendingLabel}
              onChange={(e) => setPendingLabel(e.target.value)}
              placeholder="Nom de la photo"
              className="modal-input"
              onKeyDown={(e) => e.key === "Enter" && confirmUpload()}
            />
          </Field>
          <ModalActions
            onCancel={() => {
              setPendingFiles(null);
              setPendingLabel("");
              setChosenCategory("");
              resetInputs();
            }}
            onSave={confirmUpload}
            saveLabel={uploading ? "Envoi…" : "Enregistrer"}
            disabled={uploading}
          />
        </ModalShell>
      )}

      {viewing && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img src={viewing.url} alt={viewing.label} className="w-full rounded-lg max-h-[70vh] object-contain bg-[#15191c]" />
            <div className="flex items-center justify-between mt-3">
              <div>
                <p className="text-white font-medium">{viewing.label}</p>
                <p className="text-[#c2c8cd] text-xs">{formatDate(viewing.date)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => downloadImage(viewing.url, `${(viewing.label || "photo").replace(/\s+/g, "_")}.jpg`)}
                  className="p-2 text-[#ff8a3d] hover:bg-white/10 rounded-lg"
                  aria-label="Télécharger"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setConfirmDel(viewing.id)}
                  className="p-2 text-[#ff8a8a] hover:bg-white/10 rounded-lg"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
                <button
                  onClick={() => setViewing(null)}
                  className="p-2 text-white hover:bg-white/10 rounded-lg"
                  aria-label="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette photo ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => deletePhoto(confirmDel)}
        />
      )}
    </div>
  );
}
