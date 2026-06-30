import { useState, useEffect } from "react";

// Onglet "Remarques" : une simple note libre par site, enregistrée en base.
export default function PhotosTab({ remark = "", onSaveRemark }) {
  const [remarkText, setRemarkText] = useState(remark);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setRemarkText(remark);
  }, [remark]);

  async function save() {
    if (!onSaveRemark || remarkText === remark) return;
    setSaving(true);
    try {
      await onSaveRemark(remarkText);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <label className="block text-[#aab3ba] text-sm mb-2">Remarques</label>
      <textarea
        value={remarkText}
        onChange={(e) => setRemarkText(e.target.value)}
        onBlur={save}
        placeholder="Écris une remarque sur ce site…"
        className="modal-input w-full min-h-[200px] resize-y leading-relaxed"
      />
      <div className="flex items-center justify-end gap-3 mt-2">
        {remarkText !== remark && !saving && <span className="text-[#7d868d] text-xs">Non enregistré</span>}
        <button
          onClick={save}
          disabled={saving || remarkText === remark}
          className="bg-[#1a1f23] hover:bg-[#272d32] border border-[#3a4147] text-white font-medium text-sm px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
