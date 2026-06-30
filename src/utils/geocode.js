// Géocodage des adresses via Nominatim (OpenStreetMap), gratuit et sans clé.
// Les adresses sont abrégées (ex "78 MAUBEUGE") : on développe les
// abréviations (IMP→impasse, BV→boulevard, CITE→cité, rien→rue) et on ajoute
// ", Paris, France" avant l'interrogation. Les résultats sont mis en cache
// dans localStorage pour ne géocoder chaque adresse qu'une seule fois.

const CACHE_KEY = "cvc:geocache:v2";
const CITY = "Paris, France";
// Tous les sites sont dans le 18e et le 19e : on contraint la recherche à
// cette zone (coin haut-gauche puis bas-droite) pour fiabiliser le géocodage.
const VIEWBOX = "2.325,48.905,2.410,48.868";

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
  } catch {
    return {};
  }
}
function saveCache(c) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* quota plein : tant pis, on regéocodera */
  }
}

export function expandAddress(name) {
  let s = (name || "").trim();
  // Plusieurs adresses dans un même nom (ex "12 X / 7 Y", "131/133 X+52 Y") :
  // on ne garde que la première pour le géocodage.
  s = s.split(/[/+]/)[0].trim();
  s = s.replace(/\bIMP\b/gi, "impasse");
  s = s.replace(/\bBV\b/gi, "boulevard");
  s = s.replace(/\bBD\b/gi, "boulevard");
  s = s.replace(/\bCITE\b/gi, "cité");
  const hasType =
    /\b(rue|impasse|boulevard|cité|avenue|av|passage|faubourg|all[ée]e|place|quai|chemin|route|cours|square|villa)\b/i.test(s);
  if (!hasType) {
    const m = s.match(/^(\d+\s+)(.*)$/);
    s = m ? `${m[1]}rue ${m[2]}` : `rue ${s}`;
  }
  return s;
}

async function geocodeOne(query, bounded) {
  let url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  if (bounded) url += `&viewbox=${VIEWBOX}&bounded=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
  if (!res.ok) throw new Error("geocode http " + res.status);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// Géocode une seule adresse (d'abord bornée au 18e/19e, sinon sans contrainte).
// Utilisé pour la confirmation d'emplacement à l'ajout d'un site.
export async function geocodeAddress(name) {
  const q = `${expandAddress(name)}, ${CITY}`;
  let c = await geocodeOne(q, true);
  if (!c) c = await geocodeOne(q, false);
  return c;
}

// Enregistre des coordonnées confirmées dans le cache, pour que la carte
// affiche directement l'emplacement validé sans regéocoder.
export function setGeocode(name, coords) {
  const cache = loadCache();
  cache[(name || "").trim().toUpperCase()] = coords || null;
  saveCache(cache);
}

// Géocode une liste de sites. onProgress(done, total) est appelé au fur et à
// mesure. Retourne { [siteId]: { lat, lng } | null }.
export async function geocodeSites(sites, onProgress) {
  const cache = loadCache();
  const result = {};
  let done = 0;
  let didNetwork = false;
  for (const site of sites) {
    const key = (site.name || "").trim().toUpperCase();
    if (key in cache) {
      result[site.id] = cache[key];
    } else {
      if (didNetwork) await delay(1100); // limite Nominatim : 1 requête/seconde
      try {
        const q = `${expandAddress(site.name)}, ${CITY}`;
        // D'abord borné au 18e/19e ; si rien, on réessaie sans contrainte.
        let coords = await geocodeOne(q, true);
        if (!coords) {
          await delay(1100);
          coords = await geocodeOne(q, false);
        }
        result[site.id] = coords;
      } catch {
        result[site.id] = null;
      }
      cache[key] = result[site.id];
      didNetwork = true;
      saveCache(cache);
    }
    done++;
    onProgress?.(done, sites.length);
  }
  return result;
}
