import { useState, useEffect } from "react";
import { Plus, Waves, X, Download, Trash2, Sparkles } from "lucide-react";
import * as db from "../../lib/db";
import { downloadImage } from "../../lib/download";
import { formatDate } from "../../lib/format";
import EmptyState from "../shared/EmptyState";
import ConfirmModal from "../shared/ConfirmModal";
import LoadingRow from "../shared/LoadingRow";
import PotBoueCard from "./PotBoueCard";
import AddPotBoueModal from "./AddPotBoueModal";
import NettoyageDateModal from "./NettoyageDateModal";

// Nombre maximum de pots à boue DIFFÉRENTS par site (chaque fiche peut avoir
// une quantité, mais on ne peut pas créer plus de 2 fiches distinctes) —
// même règle que les chaudières.
const MAX_POTS_BOUE = 2;

export default function PotsBoueTab({ siteId, poches, onPochesChange, showToast }) {
  const [items, setItems] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);

  const [nettoyages, setNettoyages] = useState(null);
  const [showNettoyageModal, setShowNettoyageModal] = useState(false);
  const [confirmDelNettoyage, setConfirmDelNettoyage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.listPotsBoue(siteId);
        setItems(data);
      } catch (e) {
        showToast("⚠️ Impossible de charger les pots à boue");
        setItems([]);
      }
    })();
  }, [siteId]);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.listNettoyages(siteId);
        setNettoyages(data);
      } catch (e) {
        showToast("⚠️ Impossible de charger l'historique de nettoyage");
        setNettoyages([]);
      }
    })();
  }, [siteId]);

  async function addNettoyage(date) {
    try {
      const created = await db.addNettoyage(siteId, date);
      setNettoyages([created, ...nettoyages].sort((a, b) => b.date.localeCompare(a.date)));
      setShowNettoyageModal(false);
      showToast("Nettoyage enregistré · " + formatDate(date));
    } catch (e) {
      showToast("⚠️ Erreur lors de l'enregistrement");
    }
  }

  async function deleteNettoyage(id) {
    try {
      await db.deleteNettoyage(id);
      setNettoyages(nettoyages.filter((n) => n.id !== id));
      showToast("Nettoyage supprimé");
    } catch (e) {
      showToast("⚠️ Erreur lors de la suppression");
    }
    setConfirmDelNettoyage(null);
  }

  function changePoches(delta) {
    onPochesChange(Math.max(0, (poches || 0) + delta));
  }

  async function changeQuantite(id, quantite) {
    const prev = items;
    setItems(items.map((i) => (i.id === id ? { ...i, quantite } : i)));
    try {
      await db.updatePotBoueQuantite(id, quantite);
    } catch (e) {
      setItems(prev);
      showToast("⚠️ Erreur lors de la mise à jour de la quantité");
    }
  }

  async function saveItem({ modele, photo, photoFile }) {
    // Garde-fou : on ne dépasse jamais la limite (double sécurité).
    if (items.length >= MAX_POTS_BOUE) {
      showToast(`⚠️ Maximum ${MAX_POTS_BOUE} pots à boue par site`);
      setShowAdd(false);
      return;
    }
    try {
      let photoUrl = photo || null;
      if (photoFile) photoUrl = await db.uploadImage(photoFile, "pots_boue");

      const created = await db.createPotBoue(siteId, { modele, photoUrl });
      setItems([created, ...items]);
      showToast("Pot à boue ajouté");
      setShowAdd(false);
    } catch (e) {
      showToast("⚠️ Erreur lors de l'enregistrement");
    }
  }

  async function deleteItem(id) {
    const item = items.find((i) => i.id === id);
    try {
      await db.deletePotBoue(id);
      if (item?.photo) db.removeImage(item.photo);
      setItems(items.filter((i) => i.id !== id));
      showToast("Fiche supprimée");
    } catch (e) {
      showToast("⚠️ Erreur lors de la suppression");
    }
    setConfirmDel(null);
    if (viewingPhoto?.id === id) setViewingPhoto(null);
  }

  if (items === null || nettoyages === null) return <LoadingRow />;

  const totalQuantite = items.reduce((sum, i) => sum + (i.quantite || 1), 0);
  const sortedNettoyages = nettoyages.slice().sort((a, b) => b.date.localeCompare(a.date));
  const lastNettoyage = sortedNettoyages[0];

  return (
    <div>
      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[#aab3ba] text-xs uppercase tracking-wide font-semibold mb-1">Dernier nettoyage</p>
          {lastNettoyage ? (
            <p className="font-display font-bold text-lg text-white truncate">{formatDate(lastNettoyage.date)}</p>
          ) : (
            <p className="text-[#929ba2] text-sm">Aucun nettoyage encore</p>
          )}
        </div>
        <button
          onClick={() => setShowNettoyageModal(true)}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-3 rounded-lg shrink-0"
        >
          <Sparkles size={16} strokeWidth={2.5} />
          Nettoyage
        </button>
      </div>

      {sortedNettoyages.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {sortedNettoyages.map((n) => (
            <div
              key={n.id}
              className="bg-[#15191c] border border-[#272d32] rounded-lg px-3.5 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={15} className="text-[#2b7fff]" />
                <span className="font-medium text-[#ffffff] text-sm">{formatDate(n.date)}</span>
              </div>
              <button
                onClick={() => setConfirmDelNettoyage(n.id)}
                className="text-[#7d868d] hover:text-[#ff5d5d] p-1.5 shrink-0"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4 mb-4">
        <p className="text-[#929ba2] text-xs uppercase tracking-wide font-semibold mb-2">Poches en stock</p>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => changePoches(-1)}
            className="w-11 h-11 rounded-lg bg-[#1a1f23] border border-[#3a4147] text-white text-2xl font-semibold flex items-center justify-center active:bg-[#272d32]"
            aria-label="Retirer une poche"
          >
            −
          </button>
          <span className="font-display text-4xl font-extrabold text-white tabular-nums">{poches || 0}</span>
          <button
            onClick={() => changePoches(1)}
            className="w-11 h-11 rounded-lg bg-[#2b7fff] text-[#ffffff] text-2xl font-semibold flex items-center justify-center active:bg-[#5a9eff]"
            aria-label="Ajouter une poche"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-[#aab3ba] text-sm">
          {totalQuantite} pot{totalQuantite !== 1 ? "s" : ""} à boue
        </p>
        <button
          onClick={() => setShowAdd(true)}
          disabled={items.length >= MAX_POTS_BOUE}
          title={items.length >= MAX_POTS_BOUE ? `Maximum ${MAX_POTS_BOUE} pots à boue par site` : undefined}
          className="flex items-center gap-1.5 bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-[#ffffff] font-medium text-sm px-3.5 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#1a1f23]"
        >
          <Plus size={15} strokeWidth={2.5} />
          Pot à boue
        </button>
      </div>

      {items.length >= MAX_POTS_BOUE && (
        <p className="text-[11px] text-[#7d868d] -mt-2 mb-4">
          Limite de {MAX_POTS_BOUE} pots à boue différents atteinte pour ce site.
        </p>
      )}

      {items.length === 0 && (
        <EmptyState
          icon={Waves}
          title="Aucun pot à boue enregistré"
          message="Ajoute le modèle et la plaque signalétique de chaque pot à boue du site."
          action={() => setShowAdd(true)}
          actionLabel="Ajouter un pot à boue"
        />
      )}

      <div className="grid sm:grid-cols-2 gap-2.5">
        {items.map((p) => (
          <PotBoueCard
            key={p.id}
            potBoue={p}
            onOpenPhoto={() => p.photo && setViewingPhoto(p)}
            onDelete={() => setConfirmDel(p.id)}
            onChangeQuantite={(q) => changeQuantite(p.id, q)}
          />
        ))}
      </div>

      {showAdd && <AddPotBoueModal onCancel={() => setShowAdd(false)} onSave={saveItem} />}
      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette fiche ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => deleteItem(confirmDel)}
        />
      )}

      {showNettoyageModal && (
        <NettoyageDateModal onCancel={() => setShowNettoyageModal(false)} onConfirm={addNettoyage} />
      )}
      {confirmDelNettoyage && (
        <ConfirmModal
          title="Supprimer ce nettoyage ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDelNettoyage(null)}
          onConfirm={() => deleteNettoyage(confirmDelNettoyage)}
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
                <p className="text-white font-medium truncate">{viewingPhoto.modele || "Pot à boue"}</p>
                <p className="text-[#929ba2] text-xs">Plaque signalétique</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() =>
                    downloadImage(
                      viewingPhoto.photo,
                      `plaque-${(viewingPhoto.modele || "pot-a-boue")}`.replace(/\s+/g, "_") + ".jpg"
                    )
                  }
                  className="p-2 text-[#2b7fff] hover:bg-white/10 rounded-lg"
                  aria-label="Télécharger"
                >
                  <Download size={18} />
                </button>
                <button
                  onClick={() => setConfirmDel(viewingPhoto.id)}
                  className="p-2 text-[#ff8a8a] hover:bg-white/10 rounded-lg"
                  aria-label="Supprimer"
                >
                  <Trash2 size={18} />
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
