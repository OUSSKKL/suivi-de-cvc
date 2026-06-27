export default function LoadingRow() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="w-6 h-6 rounded-full border-2 border-[#272d32] border-t-[#2b7fff] animate-spin" />
      <div className="text-[#7d868d] text-sm font-mono tracking-wide">Chargement…</div>
    </div>
  );
}
