import { Database } from "lucide-react";

export default function SetupNeeded() {
  return (
    <div className="min-h-screen bg-[#0c0e10] flex items-center justify-center px-4">
      <div className="max-w-md border border-[#272d32] rounded-xl p-6 bg-[#15191c]">
        <div className="flex items-center gap-2 text-[#ff8a3d] mb-3">
          <Database size={18} />
          <p className="font-semibold">Base de données non configurée</p>
        </div>
        <p className="text-[#aab3ba] text-sm mb-3">
          Il manque les clés Supabase. Crée un fichier <code className="text-[#e4e7ea]">.env</code> à la
          racine du projet (à partir de <code className="text-[#e4e7ea]">.env.example</code>) avec :
        </p>
        <pre className="bg-[#0c0e10] border border-[#272d32] rounded-lg p-3 text-xs text-[#c2c8cd] mb-3 overflow-x-auto">
{`VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...`}
        </pre>
        <p className="text-[#929ba2] text-xs">
          Voir le README pour les instructions complètes, puis relance <code className="text-[#e4e7ea]">npm run dev</code>.
        </p>
      </div>
    </div>
  );
}
