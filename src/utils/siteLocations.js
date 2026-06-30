// Emplacements VALIDÉS des sites (lat/lng confirmés par l'utilisateur via
// l'assistant ou en glissant un point). Stockés dans localStorage, indexés
// par le nom du site en majuscules. La carte n'affiche que les sites présents
// ici : tant qu'un site n'est pas validé, il n'apparaît pas sur la carte.

const KEY = "cvc:sitecoords:v1";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function save(o) {
  try {
    localStorage.setItem(KEY, JSON.stringify(o));
  } catch {
    /* quota plein : tant pis */
  }
}
const k = (name) => (name || "").trim().toUpperCase();

export function getAllSiteCoords() {
  return load();
}
export function getSiteCoord(name) {
  return load()[k(name)] || null;
}
export function setSiteCoord(name, coords) {
  const o = load();
  o[k(name)] = coords;
  save(o);
}
export function removeSiteCoord(name) {
  const o = load();
  delete o[k(name)];
  save(o);
}
export function clearSiteCoords() {
  save({});
}
