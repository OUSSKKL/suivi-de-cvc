export default function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-[#c2c8cd] mb-1.5">{label}</span>
      {children}
    </label>
  );
}
