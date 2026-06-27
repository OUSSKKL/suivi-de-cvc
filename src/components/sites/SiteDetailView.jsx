import { useState } from "react";
import { Gauge, Flame, Camera, ChevronLeft, Pencil } from "lucide-react";
import CompteursTab from "../compteurs/CompteursTab";
import ChaudieresTab from "../chaudieres/ChaudieresTab";
import PhotosTab from "../photos/PhotosTab";
import AddSiteModal from "./AddSiteModal";

export default function SiteDetailView({ site, tab, setTab, onBack, showToast, onKitsChange, onRename }) {
  const [editing, setEditing] = useState(false);
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
          className="group flex items-center gap-1 text-[#c2c8cd] hover:text-white text-sm font-medium mb-3 -ml-1 px-1 py-1 transition-colors"
        >
          <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
          Tous les sites
        </button>
        <div className="flex items-center gap-2">
          <h1 className="font-display text-2xl font-extrabold text-white truncate">{site.name}</h1>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 text-[#7d868d] hover:text-[#2b7fff] hover:bg-[#15191c] p-1.5 rounded-lg transition-colors"
            aria-label="Modifier le nom du site"
            title="Modifier le nom"
          >
            <Pencil size={16} />
          </button>
        </div>
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
                    ? "text-[#2b7fff] border-[#2b7fff]"
                    : "text-[#929ba2] border-transparent hover:text-[#e4e7ea] hover:border-[#3a4147]"
                }`}
              >
                <Icon size={15} className={active ? "drop-shadow-[0_0_6px_rgba(43,127,255,0.4)]" : ""} />
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

      {editing && (
        <AddSiteModal
          item={site}
          onCancel={() => setEditing(false)}
          onSave={async (name) => {
            await onRename(name);
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}
