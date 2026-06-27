import { Save } from "lucide-react";

export default function ModalActions({ onCancel, onSave, disabled, saveLabel }) {
  return (
    <div className="flex gap-2 mt-5">
      <button
        onClick={onCancel}
        className="flex-1 py-2.5 rounded-lg border border-[#3a4147] text-[#e4e7ea] font-medium text-sm hover:bg-[#1a1f23] transition-colors"
      >
        Annuler
      </button>
      <button
        onClick={onSave}
        disabled={disabled}
        className="btn-accent flex-1 py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-1.5"
      >
        <Save size={14} />
        {saveLabel}
      </button>
    </div>
  );
}
