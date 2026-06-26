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
