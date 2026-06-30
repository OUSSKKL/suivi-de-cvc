import L from "leaflet";

// Fond de carte sombre : base gris foncé "Dark Gray Canvas" (Esri) + une
// couche d'étiquettes CARTO (noms de rues) nette jusqu'au zoom 20, pour
// pouvoir lire les rues en zoomant. Les deux sont gratuits et sans clé.
export function addDarkTiles(map) {
  const base = "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}";
  const labels = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
  L.tileLayer(base, { maxNativeZoom: 16, maxZoom: 20, attribution: "Tiles © Esri" }).addTo(map);
  L.tileLayer(labels, { subdomains: "abcd", maxZoom: 20, attribution: "© CARTO" }).addTo(map);
}
