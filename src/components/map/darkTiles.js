import L from "leaflet";

// Fond de carte sombre net jusqu'au zoom 20 (CARTO Dark Matter, gratuit sans
// clé) : couche "sans étiquettes" pour les rues et bâtiments, puis couche
// "étiquettes seules" pour les noms de rues ET les numéros de bâtiment, qui
// apparaissent en zoomant fort.
export function addDarkTiles(map) {
  const base = "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png";
  const labels = "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
  const opts = { subdomains: "abcd", maxZoom: 20, attribution: "© OpenStreetMap © CARTO" };
  L.tileLayer(base, opts).addTo(map);
  L.tileLayer(labels, { ...opts, attribution: "" }).addTo(map);
}
