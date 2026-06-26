import { useState, useEffect } from "react";
import { Plus, Flame, X, Download } from "lucide-react";
import * as db from "../../lib/db";
import { downloadImage } from "../../lib/download";
import EmptyState from "../shared/EmptyState";
import ConfirmModal from "../shared/ConfirmModal";
import LoadingRow from "../shared/LoadingRow";
import ChaudiereCard from "./ChaudiereCard";
import AddChaudiereModal from "./AddChaudiereModal";

export default function ChaudieresTab({ siteId, kits, onKitsChange, showToast }) {
  const [items, setItems] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.listChaudieres(siteId);
        setItems(data);
      } catch (e) {
        showToast("⚠️ Impossible de charger les chaudières");
        setItems([]);
      }
    })();
  }, [siteId]);

  function changeKits(delta) {
    onKitsChange(Math.max(0, (kits || 0) + delta));
  }

  async function saveItem({ id, marque, modele, photo, photoFile }) {
    try {
      let photoUrl = photo || null;
      if (photoFile) photoUrl = await db.uploadImage(photoFile, "chaudieres");

      if (id) {
        const updated = await db.updateChaudiere(id, { marque, modele, photoUrl });
        setItems(items.map((i) => (i.id === id ? updated : i)));
        showToast("Fiche mise à jour");
      } else {
        const created = await db.createChaudiere(siteId, { marque, modele, photoUrl });
        setItems([created, ...items]);
        showToast("Chaudière ajoutée");
      }
      setShowAdd(false);
      setEditing(null);
    } catch (e) {
      showToast("⚠️ Erreur lors de l'enregistrement");
    }
  }

  async function deleteItem(id) {
    const item = items.find((i) => i.id === id);
    try {
      await db.deleteChaudiere(id);
      if (item?.photo) db.removeImage(item.photo);
      setItems(items.filter((i) => i.id !== id));
      showToast("Fiche supprimée");
    } catch (e) {
      showToast("⚠️ Erreur lors de la suppression");
    }
    setConfirmDel(null);
  }

  if (items === null) return <LoadingRow />;

  return (
    <div>
      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4 mb-4">
        <p className="text-[#929ba2] text-xs uppercase tracking-wide font-semibold mb-2">Kits d'allumage en stock</p>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => changeKits(-1)}
            className="w-11 h-11 rounded-lg bg-[#1a1f23] border border-[#3a4147] text-white text-2xl font-semibold flex items-center justify-center active:bg-[#272d32]"
            aria-label="Retirer un kit"
          >
            −
          </button>
          <span className="font-display text-4xl font-extrabold text-white tabular-nums">{kits || 0}</span>
          <button
            onClick={() => changeKits(1)}
            className="w-11 h-11 rounded-lg bg-[#ff8a3d] text-[#1a1006] text-2xl font-semibold flex items-center justify-center active:bg-[#ff9d5c]"
            aria-label="Ajouter un kit"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-[#aab3ba] text-sm">
          {items.length} chaudière{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-[#ffffff] font-medium text-sm px-3.5 py-2 rounded-lg transition-colors"
        >
          <Plus size={15} strokeWidth={2.5} />
          Chaudière
        </button>
      </div>

      {items.length === 0 && (
        <EmptyState
          icon={Flame}
          title="Aucune chaudière enregistrée"
          message="Ajoute la marque et le modèle de chaque chaudière du site."
          action={() => setShowAdd(true)}
          actionLabel="Ajouter une chaudière"
        />
      )}

      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((c) => (
          <ChaudiereCard
            key={c.id}
            chaudiere={c}
            onOpenPhoto={() => c.photo && setViewingPhoto(c)}
            onDelete={() => setConfirmDel(c.id)}
          />
        ))}
      </div>

      {showAdd && <AddChaudiereModal onCancel={() => setShowAdd(false)} onSave={saveItem} />}
      {editing && (
        <AddChaudiereModal item={editing} onCancel={() => setEditing(null)} onSave={saveItem} />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => deleteItem(confirmDel)}
        />
      )}

      {viewingPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={viewingPhoto.photo}
              alt="Plaque signalétique"
              className="w-full rounded-lg max-h-[70vh] object-contain bg-[#15191c]"
            />
            <div className="flex items-center justify-between mt-3">
              <div className="min-w-0">
                <p className="text-white font-medium truncate">{viewingPhoto.marque} {viewingPhoto.modele}</p>
                <p className="text-[#929ba2] text-xs">Plaque signalétique</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    downloadImage(
                      viewingPhoto.photo,
                      `plaque-${(viewingPhoto.marque || "chaudiere")}-${(viewingPhoto.modele || "")}`.replace(/\s+/g, "_") + ".jpg"
                    )
                  }
                  className="flex items-center gap-1.5 bg-[#ff8a3d] hover:bg-[#ff9d5c] text-[#1a1006] font-semibold text-sm px-3.5 py-2 rounded-lg"
                >
                  <Download size={16} />
                  Télécharger
                </button>
                <button
                  onClick={() => setViewingPhoto(null)}
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
    </div>
  );
}
