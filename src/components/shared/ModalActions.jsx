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
        className="flex-1 py-2.5 rounded-lg bg-[#ff8a3d] text-[#1a1006] font-semibold text-sm hover:bg-[#ff9d5c] disabled:opacity-40 disabled:hover:bg-[#ff8a3d] transition-colors flex items-center justify-center gap-1.5"
      >
        <Save size={14} />
        {saveLabel}
      </button>
    </div>
  );
}
