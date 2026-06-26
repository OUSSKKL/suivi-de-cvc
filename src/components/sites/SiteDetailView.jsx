import { Gauge, Flame, Camera, ChevronLeft } from "lucide-react";
import CompteursTab from "../compteurs/CompteursTab";
import ChaudieresTab from "../chaudieres/ChaudieresTab";
import PhotosTab from "../photos/PhotosTab";

export default function SiteDetailView({ site, tab, setTab, onBack, showToast, onKitsChange }) {
  const tabs = [
    { id: "compteurs", label: "Compteurs", icon: Gauge },
    { id: "chaudieres", label: "Chaudières", icon: Flame },
    { id: "photos", label: "Photos", icon: Camera },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="sticky top-0 z-20 bg-[#0c0e10]/95 backdrop-blur border-b border-[#1a1f23] px-4 pt-4 pb-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-[#c2c8cd] text-sm font-medium mb-3 -ml-1 px-1 py-1"
        >
          <ChevronLeft size={16} />
          Tous les sites
        </button>
        <h1 className="font-display text-2xl font-extrabold text-white truncate">{site.name}</h1>
        {site.address && <p className="text-[#aab3ba] text-sm mt-0.5 mb-3">{site.address}</p>}
        {!site.address && <div className="mb-3" />}

        <div className="flex gap-1 -mx-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                  active
                    ? "text-[#ff8a3d] border-[#ff8a3d]"
                    : "text-[#929ba2] border-transparent hover:text-[#e4e7ea]"
                }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 pt-5">
        {tab === "compteurs" && <CompteursTab siteId={site.id} showToast={showToast} />}
        {tab === "chaudieres" && (
          <ChaudieresTab siteId={site.id} kits={site.kits} onKitsChange={onKitsChange} showToast={showToast} />
        )}
        {tab === "photos" && <PhotosTab siteId={site.id} showToast={showToast} />}
      </div>
    </div>
  );
}
