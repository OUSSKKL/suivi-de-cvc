import { ChevronLeft, Headset, Phone } from "lucide-react";

const SAV = [
  { name: "De Dietrich", phone: "08 25 33 82 82" },
  { name: "Athlantic", phone: "03 51 42 70 03" },
  { name: "Viessmann", phone: "09 69 32 63 26" },
  { name: "Frisquet", phone: "01 60 09 91 00" },
  { name: "Trend Automate", phone: "01 87 40 66 39" },
  { name: "Siemens", phone: "0 820 16 48 22" },
  { name: "Grundfos Pompes", phone: "04 74 82 15 15" },
  { name: "Danfoss", phone: "01 82 88 64 64" },
  { name: "Aldes", phone: "09 69 32 39 98" },
];

export default function SavView({ onBack }) {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-28 pt-6 animate-fade-in">
      <button
        onClick={onBack}
        className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-4 -ml-1 px-1 py-1 transition-colors"
      >
        <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Retour
      </button>

      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-9 h-9 rounded-xl bg-surface-gradient border border-[#272d32] flex items-center justify-center shrink-0">
          <Headset size={17} className="text-[#2b7fff]" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">SAV</h1>
      </div>

      <div className="border border-[#272d32] rounded-xl overflow-hidden">
        {SAV.map((s, i) => (
          <a
            key={s.name}
            href={`tel:${s.phone.replace(/\s/g, "")}`}
            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-[#15191c] transition-colors ${
              i !== SAV.length - 1 ? "border-b border-[#272d32]" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold">SAV {s.name}</p>
              <p className="text-[#aab3ba] text-sm tabular-nums">{s.phone}</p>
            </div>
            <span className="w-9 h-9 rounded-lg bg-[#2b7fff]/10 border border-[#2b7fff]/20 flex items-center justify-center text-[#2b7fff] shrink-0">
              <Phone size={16} />
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
