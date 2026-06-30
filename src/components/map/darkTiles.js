import L from "leaflet";

// Fond de carte sombre "Dark Gray Canvas" (Esri), gratuit et sans clé :
// gris foncé épuré, proche du mode nuit d'Apple Plan. Base + libellés.
export function addDarkTiles(map) {
  const base = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  const labels = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}";
  L.tileLayer(base, { maxNativeZoom: 16, maxZoom: 19, attribution: "Tiles © Esri" }).addTo(map);
  L.tileLayer(labels, { maxNativeZoom: 16, maxZoom: 19 }).addTo(map);
}
