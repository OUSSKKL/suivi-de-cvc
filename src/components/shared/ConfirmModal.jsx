import { AlertCircle } from "lucide-react";

export default function ConfirmModal({ title, message, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        className="bg-[#15191c] border border-[#272d32] rounded-2xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <AlertCircle size={18} className="text-[#ff5d5d]" />
          <h2 className="font-display font-bold text-white">{title}</h2>
        </div>
        <p className="text-[#c2c8cd] text-sm mb-5">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-[#ff5d5d] text-[#1a0606] font-semibold text-sm hover:bg-[#ff7a7a] transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}
