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
  // Deuxième adresse après un "+" (ex "131/133 X+52 Y") : ignorée.
  s = s.split("+")[0].trim();
  // Plage de numéros "131/133", "1-11" ou "15 / 17" → on garde le 1er numéro
  // mais on conserve la rue qui suit.
  s = s.replace(/(\d+)\s*[/-]\s*\d+/g, "$1");
  // S'il reste un "/" (séparateur entre deux adresses, ex "12 X / 7 Y") :
  // on ne garde que la première.
  s = s.split("/")[0].trim();
  // "8bis"/"8 BIS" → "8 bis" (idem ter/quater), pour ne pas coller le numéro.
  s = s.replace(/(\d+)\s*(bis|ter|quater)\b/gi, "$1 $2");
  s = s.replace(/\bIMP\b/gi, "impasse");
  s = s.replace(/\bBV\b/gi, "boulevard");
  s = s.replace(/\bBD\b/gi, "boulevard");
  s = s.replace(/\bCITE\b/gi, "cité");
  // Remarque : on borne avec (^|\s)…(\s|$) plutôt que \b, car \b ne reconnaît
  // pas une fin de mot accentuée (ex "cité" : \bcité\b échoue après le "é").
  const hasType =
    /(^|\s)(rue|impasse|boulevard|cit[eé]|avenue|av|passage|faubourg|all[ée]e|place|quai|chemin|route|cours|square|villa)(\s|$)/i.test(s);
  if (!hasType) {
    // Insère "rue" après le numéro (et un éventuel bis/ter/quater).
    const m = s.match(/^(\d+(?:\s+(?:bis|ter|quater))?\s+)(.*)$/i);
    s = m ? `${m[1]}rue ${m[2]}` : `rue ${s}`;
  }
  return s;
}

// Découpe une saisie en UNE OU PLUSIEURS adresses distinctes à géocoder.
// - "131/133 RUE X"  → ["131 rue X", "133 rue X"]   (même rue, 2 numéros)
// - "12 RUE X / 7 RUE Y" → ["12 rue X", "7 rue Y"]  (2 adresses différentes)
// - "131/133 X+52 Y" → les deux adresses + la 2e après le "+"
export function expandAddresses(name) {
  const out = [];
  for (const chunk of (name || "").split("+").map((c) => c.trim()).filter(Boolean)) {
    // Plage de numéros partageant la même rue : "131/133 RUE X".
    const range = chunk.match(/^(\d+(?:\s*(?:bis|ter|quater))?)\s*\/\s*(\d+(?:\s*(?:bis|ter|quater))?)\s+(.+)$/i);
    if (range) {
      out.push(expandAddress(`${range[1]} ${range[3]}`));
      out.push(expandAddress(`${range[2]} ${range[3]}`));
    } else if (chunk.includes("/")) {
      // Deux adresses complètes séparées par "/".
      for (const part of chunk.split("/").map((p) => p.trim()).filter(Boolean)) {
        out.push(expandAddress(part));
      }
    } else {
      out.push(expandAddress(chunk));
    }
  }
  return [...new Set(out)]; // dédoublonne
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

// Adresse courte et lisible à partir des détails Nominatim (ex "12 Rue de
// Maubeuge, Paris"), avec repli sur le début du libellé complet.
function shortAddr(d) {
  const a = d.address || {};
  const num = a.house_number ? `${a.house_number} ` : "";
  const road = a.road || a.pedestrian || a.footway || a.cycleway || a.path || "";
  if (road) return `${num}${road}`.trim(); // numéro + rue, sans la ville
  return (d.display_name || "").split(",")[0].trim();
}

async function searchMany(query, bounded, limit) {
  let url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
  if (bounded) url += `&viewbox=${VIEWBOX}&bounded=1`;
  const res = await fetch(url, { headers: { "Accept-Language": "fr" } });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((d) => ({ lat: parseFloat(d.lat), lng: parseFloat(d.lon), label: d.display_name, short: shortAddr(d) }));
}

// Suggestions d'adresses pour l'autocomplétion pendant la saisie libre.
// On ne découpe pas sur "/" ici (l'utilisateur tape une seule adresse) ;
// recherche d'abord dans le 18e/19e, puis sans contrainte si rien.
export async function suggestAddresses(query, limit = 5) {
  const raw = (query || "").trim();
  if (raw.length < 3) return [];
  // Développe les abréviations (bv/bd→boulevard, imp→impasse…) avant la
  // recherche, sinon Nominatim ne trouve rien (ex "bv mortier").
  const q = expandAddress(raw);
  let results = await searchMany(`${q}, ${CITY}`, true, limit);
  if (results.length === 0) results = await searchMany(`${q}, ${CITY}`, false, limit);
  return results;
}

// Renvoie plusieurs adresses candidates (propositions réelles) pour un site,
// d'abord dans le 18e/19e puis, si rien, sans contrainte de zone.
// Si la saisie contient plusieurs adresses (séparées par "/" ou "+"), on
// propose des candidats pour CHACUNE d'elles.
export async function geocodeCandidates(name, limit = 5) {
  const addrs = expandAddresses(name);

  if (addrs.length <= 1) {
    const q = `${addrs[0] || expandAddress(name)}, ${CITY}`;
    let results = await searchMany(q, true, limit);
    if (results.length === 0) results = await searchMany(q, false, limit);
    return results;
  }

  // Plusieurs adresses : on récupère les meilleurs résultats de chacune.
  const out = [];
  const per = Math.max(2, Math.ceil(limit / addrs.length));
  for (let i = 0; i < addrs.length; i++) {
    if (i > 0) await delay(1100); // limite Nominatim : ~1 requête/seconde
    const q = `${addrs[i]}, ${CITY}`;
    let r = await searchMany(q, true, per);
    if (r.length === 0) r = await searchMany(q, false, per);
    out.push(...r);
  }

  // Dédoublonne par libellé en conservant l'ordre (1re adresse en premier).
  const seen = new Set();
  return out.filter((x) => {
    if (seen.has(x.label)) return false;
    seen.add(x.label);
    return true;
  });
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
