// Force le téléchargement d'une image distante (le simple <a download> ne
// fonctionne pas pour une URL cross-origin comme Supabase Storage : le
// navigateur ouvre l'image au lieu de la télécharger).
export async function downloadImage(url, filename) {
  const response = await fetch(url);
  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}

// Exporte un tableau en CSV (séparateur `;` pour qu'Excel FR le lise bien).
export function downloadCSV(filename, headers, rows) {
  function escape(val) {
    const s = String(val ?? "");
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  const lines = [headers, ...rows].map((row) => row.map(escape).join(";"));
  const csv = "﻿" + lines.join("\r\n"); // BOM pour les accents sous Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(blobUrl);
}
