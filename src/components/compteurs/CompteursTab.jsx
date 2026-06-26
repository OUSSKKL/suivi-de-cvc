import { useState, useEffect } from "react";
import { Gauge, Trash2 } from "lucide-react";
import * as db from "../../lib/db";
import { formatDate } from "../../lib/format";
import EmptyState from "../shared/EmptyState";
import ConfirmModal from "../shared/ConfirmModal";
import LoadingRow from "../shared/LoadingRow";
import DateConfirmModal from "./DateConfirmModal";

// ---------- Compteurs Tab (suivi des dates de relevé) ----------
export default function CompteursTab({ siteId, showToast }) {
  const [items, setItems] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await db.listReleves(siteId);
        setItems(data);
      } catch (e) {
        showToast("⚠️ Impossible de charger les relevés");
        setItems([]);
      }
    })();
  }, [siteId]);

  async function addReading(date) {
    try {
      const created = await db.addReleve(siteId, date);
      setItems([created, ...items].sort((a, b) => b.date.localeCompare(a.date)));
      setShowDateModal(false);
      showToast("Relevé enregistré · " + formatDate(date));
    } catch (e) {
      showToast("⚠️ Erreur lors de l'enregistrement");
    }
  }

  async function deleteReading(id) {
    try {
      await db.deleteReleve(id);
      setItems(items.filter((r) => r.id !== id));
      showToast("Relevé supprimé");
    } catch (e) {
      showToast("⚠️ Erreur lors de la suppression");
    }
    setConfirmDel(null);
  }

  if (items === null) return <LoadingRow />;

  const sorted = items.slice().sort((a, b) => b.date.localeCompare(a.date));
  const last = sorted[0];

  return (
    <div>
      <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4 mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[#aab3ba] text-xs uppercase tracking-wide font-semibold mb-1">Dernier relevé</p>
          {last ? (
            <p className="font-display font-bold text-lg text-white truncate">{formatDate(last.date)}</p>
          ) : (
            <p className="text-[#929ba2] text-sm">Aucun relevé encore</p>
          )}
        </div>
        <button
          onClick={() => setShowDateModal(true)}
          className="flex items-center gap-1.5 bg-[#ff8a3d] hover:bg-[#ff9d5c] text-[#1a1006] font-semibold text-sm px-4 py-3 rounded-lg transition-colors shrink-0"
        >
          <Gauge size={16} strokeWidth={2.5} />
          Relevé
        </button>
      </div>

      <p className="text-[#aab3ba] text-sm mb-2.5">
        {items.length} relevé{items.length !== 1 ? "s" : ""} enregistré{items.length !== 1 ? "s" : ""}
      </p>

      {items.length === 0 ? (
        <EmptyState
          icon={Gauge}
          title="Aucun relevé enregistré"
          message="Appuie sur le bouton Relevé à chaque passage sur site pour garder une trace des dates."
          action={() => setShowDateModal(true)}
          actionLabel="Faire un relevé"
        />
      ) : (
        <div className="space-y-1.5">
          {sorted.map((r) => (
            <div
              key={r.id}
              className="bg-[#15191c] border border-[#272d32] rounded-lg px-3.5 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <Gauge size={15} className="text-[#ff8a3d]" />
                <span className="font-medium text-[#ffffff] text-sm">{formatDate(r.date)}</span>
              </div>
              <button
                onClick={() => setConfirmDel(r.id)}
                className="text-[#7d868d] hover:text-[#ff5d5d] p-1.5 shrink-0"
                aria-label="Supprimer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showDateModal && (
        <DateConfirmModal onCancel={() => setShowDateModal(false)} onConfirm={addReading} />
      )}

      {confirmDel && (
        <ConfirmModal
          title="Supprimer ce relevé ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => deleteReading(confirmDel)}
        />
      )}
    </div>
  );
}
