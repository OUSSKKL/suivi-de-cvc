import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, MapPin, Trash2 } from "lucide-react";
import * as db from "../../lib/db";
import { formatDate } from "../../lib/format";
import { MOIS } from "../../data/constants";
import { durationHours, formatDuration } from "../../utils/duration";
import LoadingRow from "../shared/LoadingRow";
import EmptyState from "../shared/EmptyState";
import ConfirmModal from "../shared/ConfirmModal";
import AddAstreinteModal from "./AddAstreinteModal";

export default function AstreinteView({ onBack, showToast }) {
  const [items, setItems] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const now = new Date();
  // Mois affiché, en index absolu (année*12 + mois). Par défaut : mois courant.
  const [monthIndex, setMonthIndex] = useState(now.getFullYear() * 12 + now.getMonth());

  useEffect(() => {
    (async () => {
      try {
        setItems(await db.listAstreintes());
      } catch (e) {
        showToast?.("⚠️ Impossible de charger l'astreinte");
        setItems([]);
      }
    })();
  }, []);

  async function addItem(data) {
    try {
      const created = await db.addAstreinte(data);
      setItems([created, ...items]);
      setShowAdd(false);
      // Se place sur le mois de l'intervention ajoutée pour la voir tout de suite.
      const [y, m] = created.date.split("-").map(Number);
      setMonthIndex(y * 12 + (m - 1));
      showToast?.("Intervention enregistrée");
    } catch (e) {
      showToast?.("⚠️ Erreur lors de l'enregistrement");
    }
  }

  async function deleteItem(id) {
    try {
      await db.deleteAstreinte(id);
      setItems(items.filter((i) => i.id !== id));
      showToast?.("Intervention supprimée");
    } catch (e) {
      showToast?.("⚠️ Erreur lors de la suppression");
    }
    setConfirmDel(null);
  }

  if (items === null)
    return (
      <div className="max-w-3xl mx-auto px-4 pt-6">
        <LoadingRow />
      </div>
    );

  const selYear = Math.floor(monthIndex / 12);
  const selMonth = ((monthIndex % 12) + 12) % 12;
  const monthKey = `${selYear}-${String(selMonth + 1).padStart(2, "0")}`;

  const monthItems = items
    .filter((it) => (it.date || "").slice(0, 7) === monthKey)
    .sort((a, b) => (b.date + b.startTime).localeCompare(a.date + a.startTime));
  const monthTotalH = monthItems.reduce((s, it) => s + durationHours(it.startTime, it.endTime), 0);
  const grandTotalH = items.reduce((s, it) => s + durationHours(it.startTime, it.endTime), 0);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
            <Clock size={17} className="text-[#2b7fff]" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-white">Astreinte</h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-accent flex items-center gap-1.5 font-semibold text-sm px-4 py-2.5 rounded-lg shrink-0"
        >
          <Plus size={17} strokeWidth={2.5} />
          Intervention
        </button>
      </div>

      {items.length > 0 && (
        <div className="bg-[#15191c] border border-[#272d32] rounded-xl p-4 mb-4 flex items-center justify-around gap-3 text-center">
          <div>
            <p className="font-display text-2xl font-extrabold text-white tabular-nums">{items.length}</p>
            <p className="text-[#929ba2] text-xs">sortie{items.length !== 1 ? "s" : ""} au total</p>
          </div>
          <div className="w-px self-stretch bg-[#272d32]" />
          <div>
            <p className="font-display text-2xl font-extrabold text-[#2b7fff] tabular-nums">{formatDuration(grandTotalH)}</p>
            <p className="text-[#929ba2] text-xs">au total</p>
          </div>
        </div>
      )}

      {/* Navigation entre les mois */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <button
          onClick={() => setMonthIndex(monthIndex - 1)}
          className="p-2.5 rounded-lg bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] hover:bg-[#1a1f23] text-[#c2c8cd] hover:text-white transition-colors"
          aria-label="Mois précédent"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="font-display font-bold text-white capitalize leading-tight">
            {MOIS[selMonth]} {selYear}
          </p>
          <p className="text-xs text-[#929ba2]">
            {monthItems.length} sortie{monthItems.length !== 1 ? "s" : ""}
            <span className="text-[#3a4147] mx-1">·</span>
            <span className="font-semibold text-[#2b7fff]">{formatDuration(monthTotalH)}</span>
          </p>
        </div>
        <button
          onClick={() => setMonthIndex(monthIndex + 1)}
          className="p-2.5 rounded-lg bg-[#15191c] border border-[#272d32] hover:border-[#3a4147] hover:bg-[#1a1f23] text-[#c2c8cd] hover:text-white transition-colors"
          aria-label="Mois suivant"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Aucune intervention d'astreinte"
          message="Appuie sur Intervention pour enregistrer une sortie : adresse, date, heure de début et de fin."
          action={() => setShowAdd(true)}
          actionLabel="Ajouter une intervention"
        />
      ) : monthItems.length === 0 ? (
        <p className="text-[#929ba2] text-sm text-center border border-dashed border-[#272d32] rounded-xl py-8">
          Aucune sortie ce mois-ci.
        </p>
      ) : (
        <div className="border border-[#272d32] rounded-xl overflow-hidden">
          {monthItems.map((it, i) => (
            <div
              key={it.id}
              className={`flex items-center gap-3 px-4 py-3 hover:bg-[#15191c] transition-colors ${
                i !== monthItems.length - 1 ? "border-b border-[#272d32]" : ""
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-white text-sm font-semibold">{formatDate(it.date)}</span>
                  <span className="text-[#7d868d] text-xs tabular-nums">
                    {it.startTime} → {it.endTime}
                  </span>
                  <span className="font-semibold text-[#2b7fff] text-xs tabular-nums">
                    {formatDuration(durationHours(it.startTime, it.endTime))}
                  </span>
                </div>
                {it.address && (
                  <p className="flex items-center gap-1 text-[#aab3ba] text-xs truncate">
                    <MapPin size={12} className="shrink-0 text-[#7d868d]" />
                    {it.address}
                  </p>
                )}
              </div>
              <button
                onClick={() => setConfirmDel(it.id)}
                className="text-[#7d868d] hover:text-[#ff5d5d] p-1.5 shrink-0"
                aria-label="Supprimer l'intervention"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && <AddAstreinteModal onCancel={() => setShowAdd(false)} onSave={addItem} />}

      {confirmDel && (
        <ConfirmModal
          title="Supprimer cette intervention ?"
          message="Cette action est définitive."
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => deleteItem(confirmDel)}
        />
      )}
    </div>
  );
}
