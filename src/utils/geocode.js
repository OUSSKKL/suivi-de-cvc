// Géocodage des adresses via Nominatim (OpenStreetMap), gratuit et sans clé.
// Les adresses sont abrégées (ex "78 MAUBEUGE") : on développe les
// abréviations (IMP→impasse, BV→boulevard, CITE→cité, rien→rue) et on ajoute
// ", Paris, France" avant l'interrogation. Les résultats sont mis en cache
// dans localStorage pour ne géocoder chaque adresse qu'une seule fois.

const CACHE_KEY = "cvc:geocache:v1";
const CITY = "Paris, France";

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

async function geocodeOne(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
  if (!res.ok) throw new Error("geocode http " + res.status);
  const data = await res.json();
  if (!data || data.length === 0) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

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
        result[site.id] = await geocodeOne(`${expandAddress(site.name)}, ${CITY}`);
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
