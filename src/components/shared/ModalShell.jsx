import { X } from "lucide-react";

export default function ModalShell({ children, onCancel, title, icon }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center" onClick={onCancel}>
      <div
        className="bg-[#15191c] border border-[#272d32] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <span className="text-[#ff8a3d]">{icon}</span>
            {title}
          </h2>
          <button onClick={onCancel} className="text-[#929ba2] hover:text-white p-1" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
