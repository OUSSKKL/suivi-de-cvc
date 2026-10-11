import { useState } from "react";
import { Gauge, Flame, StickyNote, Droplets, Waves, ChevronLeft, Pencil, Building2, X } from "lucide-react";
import CompteursTab from "../compteurs/CompteursTab";
import ChaudieresTab from "../chaudieres/ChaudieresTab";
import AdoucisseurTab from "../adoucisseur/AdoucisseurTab";
import PotsBoueTab from "../potsboue/PotsBoueTab";
import PhotosTab from "../photos/PhotosTab";
import AddSiteModal from "./AddSiteModal";
import { CLIENT_ORDER, compareClients } from "../../utils/sortSites";

export default function SiteDetailView({
  site,
  tab,
  setTab,
  onBack,
  showToast,
  onKitsChange,
  onPochesChange,
  onAdoucisseurChange,
  onRename,
  onSaveRemark,
  onSaveClient,
  clients = [],
  canEdit: canEditProp,
  readOnly = false,
}) {
  // Lecture seule (admin) : aucun bouton de modification, même le nom/client.
  const canEdit = canEditProp && !readOnly;
  const [editing, setEditing] = useState(false);
  const [editingClient, setEditingClient] = useState(false);
  const tabs = [
    { id: "compteurs", label: "Compteurs", icon: Gauge },
    { id: "chaudieres", label: "Chaudières", icon: Flame },
    { id: "adoucisseur", label: "Adoucisseur", icon: Droplets },
    { id: "potsboue", label: "Pot à boue", icon: Waves },
    { id: "photos", label: "Remarques", icon: StickyNote },
  ];

  return (
    <div className="max-w-3xl mx-auto pb-24 animate-fade-in">
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
          {canEdit && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-[#7d868d] hover:text-[#2b7fff] hover:bg-[#15191c] p-1.5 rounded-lg transition-colors"
              aria-label="Modifier le nom du site"
              title="Modifier le nom"
            >
              <Pencil size={16} />
            </button>
          )}
        </div>
        {site.address && <p className="text-[#aab3ba] text-sm mt-0.5">{site.address}</p>}
        {/* Client du site : modifiable par l'admin seulement. */}
        {onSaveClient && canEdit && (
          <button
            onClick={() => setEditingClient(true)}
            className="mt-1.5 mb-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-[#272d32] text-[#c2c8cd] hover:border-[#2b7fff]/40 hover:text-white transition-colors"
          >
            <Building2 size={13} />
            {site.client ? site.client : "Ajouter un client"}
            <Pencil size={11} className="text-[#7d868d]" />
          </button>
        )}
        {/* Technicien : client affiché en lecture seule. */}
        {!canEdit && site.client && (
          <span className="mt-1.5 mb-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border border-[#272d32] text-[#c2c8cd]">
            <Building2 size={13} />
            {site.client}
          </span>
        )}
        {(!onSaveClient || !canEdit) && !site.client && <div className="mb-3" />}
        {!onSaveClient && canEdit && site.client && <div className="mb-3" />}

        <div className="flex gap-1 -mx-1 overflow-x-auto no-scrollbar">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap shrink-0 ${
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
        {readOnly && (
          <p className="text-[11px] text-[#7d868d] mb-3">Consultation seule : aucune modification possible.</p>
        )}
        {tab === "compteurs" && <CompteursTab siteId={site.id} showToast={showToast} readOnly={readOnly} />}
        {tab === "chaudieres" && (
          <ChaudieresTab siteId={site.id} kits={site.kits} onKitsChange={onKitsChange} showToast={showToast} readOnly={readOnly} />
        )}
        {tab === "adoucisseur" && (
          <AdoucisseurTab
            etat={site.adoucisseurEtat}
            usage={site.adoucisseurUsage}
            sel={site.adoucisseurSel}
            onChange={onAdoucisseurChange}
            readOnly={readOnly}
          />
        )}
        {tab === "potsboue" && (
          <PotsBoueTab siteId={site.id} poches={site.poches} onPochesChange={onPochesChange} showToast={showToast} readOnly={readOnly} />
        )}
        {tab === "photos" && (
          <PhotosTab siteId={site.id} remark={site.remark} onSaveRemark={onSaveRemark} showToast={showToast} readOnly={readOnly} />
        )}
      </div>

      {editingClient && canEdit && (
        <ClientModal
          current={site.client || ""}
          clients={clients}
          onCancel={() => setEditingClient(false)}
          onSave={async (c) => {
            setEditingClient(false);
            if (c !== (site.client || "")) await onSaveClient(c);
          }}
        />
      )}

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

// Choix du client : boutons rapides (clients connus) + saisie libre.
function ClientModal({ current, clients, onCancel, onSave }) {
  const [value, setValue] = useState(current);
  const options = [...new Set([...CLIENT_ORDER, ...clients.map((c) => c.toUpperCase())])].sort(compareClients);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-[#0f1214] border border-[#272d32] rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-lg">Client du site</h2>
          <button onClick={onCancel} className="text-[#7d868d] hover:text-white p-1" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {options.map((c) => (
            <button
              key={c}
              onClick={() => setValue(c)}
              className={`text-sm font-semibold py-2.5 rounded-lg border transition-colors ${
                value === c
                  ? "bg-[#2b7fff]/15 border-[#2b7fff]/50 text-[#2b7fff]"
                  : "border-[#272d32] text-[#c2c8cd] hover:bg-[#15191c]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Autre client…"
          className="w-full bg-[#15191c] border border-[#272d32] rounded-lg px-3 py-2.5 text-base text-white placeholder-[#7d868d] focus:border-[#2b7fff] focus:outline-none mb-4"
        />

        <div className="flex gap-2">
          {current && (
            <button
              onClick={() => onSave("")}
              className="border border-[#272d32] text-[#ff8a8a] font-semibold text-sm px-3 py-2.5 rounded-lg hover:bg-[#15191c]"
            >
              Retirer
            </button>
          )}
          <button
            onClick={onCancel}
            className="flex-1 border border-[#272d32] text-[#c2c8cd] font-semibold text-sm py-2.5 rounded-lg hover:bg-[#15191c]"
          >
            Annuler
          </button>
          <button
            onClick={() => onSave(value.trim())}
            className="btn-accent flex-1 font-semibold text-sm py-2.5 rounded-lg"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
