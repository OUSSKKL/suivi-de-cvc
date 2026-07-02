import { useState } from "react";
import { ChevronLeft, Package, Phone, Mail, Copy, Check, Navigation } from "lucide-react";
import FournisseurMap from "./FournisseurMap";

const FOURNISSEURS = [
  {
    name: "Proservice",
    specialite: "Pompe, régulation, pièce chaudière…",
    lieu: "Aubervilliers",
    adresse: "27 rue Heurtault, 93300 Aubervilliers",
    color: "#f59e0b",
    locations: [
      { adresse: "27 rue Heurtault, 93300 Aubervilliers", coord: { lat: 48.9146, lng: 2.3826 } },
      { adresse: "9 rue de l'Orme Saint-Germain, 91160 Champlan", coord: { lat: 48.6975, lng: 2.2870 } },
    ],
    emails: ["alexis.breton@proservice-sema.fr", "contact@proservice-sema.fr", "matthieu.vadenne@proservice-sema.fr"],
    phones: ["01.53.56.91.00", "07.61.40.30.05"],
  },
  {
    name: "Cosmac",
    specialite: "Pièce d'usure chaudière, sonde allumage, petite fourniture…",
    lieu: "Paris 12e",
    adresse: "27 rue Marsoulan, 75012 Paris",
    color: "#ef4444",
    locations: [
      { adresse: "27 rue Marsoulan, 75012 Paris", coord: { lat: 48.8449, lng: 2.4009 } },
      { adresse: "5 rue Mozart, ZI du Parc, 93130 Noisy-le-Sec", coord: { lat: 48.8925, lng: 2.4570 } },
      { adresse: "18 avenue Arago, 91380 Chilly-Mazarin", coord: { lat: 48.7025, lng: 2.3110 } },
      { adresse: "87 rue Gallieni, 92100 Boulogne-Billancourt", coord: { lat: 48.8360, lng: 2.2410 } },
    ],
    emails: ["pdr@cosmac.fr", "r.blanpain@cosmac.fr", "pieces.detachees@cosmac.fr"],
    phones: ["01.49.72.85.00"],
  },
  {
    name: "Eau et Vapeur",
    specialite: "Vapeur, pompe, régulation, pièce chaudière…",
    lieu: "Saint-Denis",
    adresse: "2 rue Charles Christofle, 93200 Saint-Denis",
    color: "#10b981",
    locations: [{ adresse: "2 rue Charles Christofle, 93200 Saint-Denis", coord: { lat: 48.9198, lng: 2.3597 } }],
    emails: ["commercial@eau-vapeur.fr"],
    phones: ["01.48.22.20.20", "06.08.24.74.55"],
  },
  {
    name: "Roclim",
    specialite: "Pompe, régulation, pièce chaudière…",
    lieu: "Clamart",
    adresse: "59 avenue Marguerite Renaudin, 92140 Clamart",
    color: "#a855f7",
    locations: [
      { adresse: "59 avenue Marguerite Renaudin, 92140 Clamart", coord: { lat: 48.7970, lng: 2.2610 } },
      { adresse: "15 avenue des Deux Lacs, 91140 Villejust", coord: { lat: 48.6820, lng: 2.2280 } },
    ],
    emails: ["roclim@roclim.fr"],
    phones: ["01.46.44.97.97"],
  },
  {
    name: "Cedeo",
    specialite: "Plomberie, PVC, petite fourniture…",
    lieu: "Paris 19e",
    adresse: "144 boulevard de la Villette, 75019 Paris",
    color: "#2b7fff",
    locations: [
      // Paris
      { adresse: "144 boulevard de la Villette, 75019 Paris", coord: { lat: 48.8817, lng: 2.3705 } },
      { adresse: "217 rue d'Aubervilliers, 75018 Paris", coord: { lat: 48.8930, lng: 2.3705 } },
      { adresse: "32 rue Damrémont, 75018 Paris", coord: { lat: 48.8888, lng: 2.3378 } },
      { adresse: "138-140 avenue Ledru-Rollin, 75011 Paris", coord: { lat: 48.8515, lng: 2.3775 } },
      { adresse: "19 boulevard Jules Ferry, 75011 Paris", coord: { lat: 48.8672, lng: 2.3688 } },
      { adresse: "43 rue de Reuilly, 75012 Paris", coord: { lat: 48.8432, lng: 2.3888 } },
      { adresse: "70 quai Panhard et Levassor, 75013 Paris", coord: { lat: 48.8280, lng: 2.3820 } },
      { adresse: "22-30 rue Mathurin Régnier, 75015 Paris", coord: { lat: 48.8390, lng: 2.3080 } },
      { adresse: "124 bis avenue de Villiers, 75017 Paris", coord: { lat: 48.8845, lng: 2.2960 } },
      { adresse: "166 rue Cardinet, 75017 Paris", coord: { lat: 48.8875, lng: 2.3115 } },
      // Petite couronne (92 / 93 / 94)
      { adresse: "110 bis rue du Général Leclerc, 93500 Pantin", coord: { lat: 48.8975, lng: 2.4085 } },
      { adresse: "93 rue de Paris, 93000 Bobigny", coord: { lat: 48.9045, lng: 2.4390 } },
      { adresse: "40 route Principale du Port, 92230 Gennevilliers", coord: { lat: 48.9315, lng: 2.2960 } },
      { adresse: "16 avenue des Guilleraies, 92000 Nanterre", coord: { lat: 48.9095, lng: 2.2110 } },
      { adresse: "16 rue René Descartes, 94400 Vitry-sur-Seine", coord: { lat: 48.7865, lng: 2.4025 } },
      { adresse: "2 rue du Commandant de Paris, ZI des Petites Haies, 94000 Créteil", coord: { lat: 48.7820, lng: 2.4650 } },
    ],
    emails: ["paris18@cedeo.fr", "paris19@cedeo.fr", "paris11-ledru-rollin@cedeo.fr"],
    phones: ["01.44.65.11.22", "01.55.56.36.50", "01.44.93.77.34"],
  },
  {
    name: "Rexel",
    specialite: "Électricité",
    emails: ["valenton@rexel.fr"],
    phones: ["01.56.32.20.90"],
  },
  {
    name: "Legoueix",
    specialite: "Outillage",
    emails: ["commercial@legoueix.com"],
    phones: ["01.41.32.33.42"],
  },
  {
    name: "Distrisel",
    specialite: "Sel pour adoucisseur",
    emails: ["gcormon@distrisel.com", "slelard@distrisel.com"],
    phones: ["01.48.11.71.00", "07.60.31.39.74"],
  },
  {
    name: "PPC",
    specialite: "Pièce d'usure chaudière, sonde allumage, petite fourniture…",
    emails: ["ppc-creteil@groupeppc.fr", "ppc-taverny@groupeppc.fr"],
    phones: ["01.43.77.29.07", "01.61.35.18.94"],
  },
  {
    name: "Aspide",
    specialite: "Toute pièce chaudière Viessmann",
    emails: ["marc@aspide-chauffage.fr", "daniel@aspide-chauffage.fr"],
    phones: ["01.46.01.51.53"],
  },
  {
    name: "PUM",
    specialite: "Plomberie, PVC, petite fourniture…",
    emails: ["malf@mypum.fr"],
    phones: ["01.42.07.31.00"],
  },
  {
    name: "Sofinther",
    specialite: "Pompe, régulation, pièce chaudière…",
    emails: ["emilie.bouin@sofinther.fr", "geoffrey.gerold@sofinther.fr"],
    phones: ["01.30.76.81.07", "06.11.21.29.05"],
  },
];

export default function FournisseurView({ onBack }) {
  const [copied, setCopied] = useState(null);

  async function copyEmail(email) {
    let ok = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
        ok = true;
      }
    } catch (e) {
      /* clipboard indisponible (http, permissions…) → fallback ci-dessous */
    }
    if (!ok) {
      // Fallback pour contextes non sécurisés (http) où navigator.clipboard est absent
      try {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        ok = document.execCommand("copy");
        document.body.removeChild(ta);
      } catch (e) {
        /* copie non supportée */
      }
    }
    if (ok) {
      setCopied(email);
      setTimeout(() => setCopied((c) => (c === email ? null : c)), 1500);
    }
  }

  function openItineraire(f) {
    // Itinéraire Waze depuis la position actuelle vers le fournisseur
    // (lieu connu, sinon recherche par nom).
    // On navigue directement (pas de window.open) : sur iOS ça laisse le
    // système ouvrir l'app Waze au lieu d'un onglet vide dans le navigateur.
    const cible = f.adresse
      ? f.adresse
      : f.lieu
        ? `${f.name} ${f.lieu}`
        : `${f.name} ${f.specialite.split(",")[0]} Paris`;
    window.location.href = `https://waze.com/ul?q=${encodeURIComponent(cible)}&navigate=yes`;
  }

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
          <Package size={17} className="text-[#2b7fff]" />
        </div>
        <h1 className="font-display text-2xl font-extrabold text-white">Fournisseurs</h1>
      </div>

      <FournisseurMap fournisseurs={FOURNISSEURS} />

      <div className="grid gap-2.5">
        {FOURNISSEURS.map((f) => (
          <div key={f.name} className="border border-[#272d32] rounded-xl bg-[#15191c] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-white text-sm font-bold">
                  {f.name}
                  {f.lieu && <span className="ml-2 text-[#7d868d] text-xs font-medium">· {f.lieu}</span>}
                </p>
                <p className="text-[#929ba2] text-xs mb-3">{f.specialite}</p>
              </div>
              <button
                onClick={() => openItineraire(f)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#2b7fff]/10 border border-[#2b7fff]/20 text-[#2b7fff] text-xs font-semibold hover:bg-[#2b7fff]/20 transition-colors"
                title="Itinéraire depuis le 18e"
              >
                <Navigation size={13} />
                Itinéraire
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              {f.phones.map((p) => (
                <a
                  key={p}
                  href={`tel:${p.replace(/[.\s]/g, "")}`}
                  className="flex items-center gap-2 text-[#2b7fff] text-sm hover:underline"
                >
                  <Phone size={14} className="shrink-0" />
                  <span className="tabular-nums">{p}</span>
                </a>
              ))}
              {f.emails.map((e) => (
                <div key={e} className="flex items-center gap-2">
                  <a
                    href={`mailto:${e}`}
                    className="flex items-center gap-2 min-w-0 flex-1 text-[#aab3ba] text-sm hover:text-white transition-colors"
                  >
                    <Mail size={14} className="shrink-0 text-[#7d868d]" />
                    <span className="truncate">{e}</span>
                  </a>
                  <button
                    onClick={() => copyEmail(e)}
                    className="shrink-0 flex items-center justify-center w-7 h-7 rounded-lg border border-[#272d32] hover:border-[#3a4147] text-[#7d868d] hover:text-white transition-colors"
                    aria-label="Copier l'adresse"
                    title="Copier l'adresse"
                  >
                    {copied === e ? <Check size={14} className="text-[#2b7fff]" /> : <Copy size={14} />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
