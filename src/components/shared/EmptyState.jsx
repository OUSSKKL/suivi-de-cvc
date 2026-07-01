export default function EmptyState({ icon: Icon, title, message, action, actionLabel }) {
  return (
    <div className="border border-dashed border-[#272d32] rounded-xl p-8 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2b7fff]/15 to-transparent ring-1 ring-[#2b7fff]/10 flex items-center justify-center mx-auto mb-3">
        <Icon size={24} className="text-[#2b7fff]/80" />
      </div>
      <p className="text-[#e4e7ea] font-medium mb-1">{title}</p>
      <p className={`text-[#929ba2] text-sm ${actionLabel ? "mb-4" : ""}`}>{message}</p>
      {actionLabel && (
        <button onClick={action} className="text-[#2b7fff] text-sm font-semibold underline underline-offset-2">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
