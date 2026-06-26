export default function EmptyState({ icon: Icon, title, message, action, actionLabel }) {
  return (
    <div className="border border-dashed border-[#272d32] rounded-xl p-8 text-center">
      <Icon size={26} className="mx-auto text-[#5a6168] mb-3" />
      <p className="text-[#e4e7ea] font-medium mb-1">{title}</p>
      <p className="text-[#929ba2] text-sm mb-4">{message}</p>
      <button onClick={action} className="text-[#ff8a3d] text-sm font-semibold underline underline-offset-2">
        {actionLabel}
      </button>
    </div>
  );
}
