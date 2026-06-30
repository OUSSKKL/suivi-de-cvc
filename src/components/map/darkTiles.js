import L from "leaflet";
import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-leaflet";

// Fond de carte VECTORIEL (OpenFreeMap, gratuit sans clé) affiché dans Leaflet
// via MapLibre GL. Avantage du vectoriel : on peut RETIRER des couches.
// - on garde les noms de rues ET les numéros de bâtiment (couche "housenumber") ;
// - on supprime les POI (cafés, magasins…) et les transports (métro, bus…) ;
// - on assombrit le rendu via un filtre CSS pour rester sur le thème sombre.

// Une couche est masquée si son id ou sa source-layer correspond à du POI ou
// du transport en commun (sans toucher aux rues, bâtiments et numéros).
function isClutterLayer(layer) {
  const id = (layer.id || "").toLowerCase();
  const src = (layer["source-layer"] || "").toLowerCase();
  const needles = ["poi", "transit", "aerodrome", "aeroway", "ferry"];
  return needles.some((n) => id.includes(n) || src.includes(n));
}

export function addDarkTiles(map) {
  const gl = L.maplibreGL({
    style: "https://tiles.openfreemap.org/styles/positron",
    attribution: "",
  }).addTo(map);

  // Quand le style vectoriel est chargé : on enlève les couches superflues et
  // on AJOUTE les numéros de bâtiment (le style positron ne les dessine pas,
  // mais la donnée "housenumber" est bien présente dans les tuiles).
  const m = gl.getMaplibreMap();
  const setup = () => {
    const style = m.getStyle();
    if (!style || !style.layers) return;

    for (const layer of style.layers) {
      if (isClutterLayer(layer) && m.getLayer(layer.id)) {
        m.removeLayer(layer.id);
      }
    }

    if (!m.getLayer("housenumbers")) {
      // Couleurs choisies pour rester lisibles APRÈS le filtre CSS d'inversion :
      // texte sombre -> devient clair, halo clair -> devient sombre.
      m.addLayer({
        id: "housenumbers",
        type: "symbol",
        source: "openmaptiles",
        "source-layer": "housenumber",
        minzoom: 17,
        layout: {
          "text-field": ["get", "housenumber"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 11,
          "text-padding": 2,
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1d1d1d",
          "text-halo-color": "#f2f2f2",
          "text-halo-width": 1.1,
        },
      });
    }
  };
  if (m.isStyleLoaded()) setup();
  else m.on("load", setup);

  // Assombrit le canvas vectoriel (sans toucher aux marqueurs Leaflet).
  const wrap = gl.getContainer?.() || m.getContainer();
  if (wrap) wrap.classList.add("osm-dark");
}
