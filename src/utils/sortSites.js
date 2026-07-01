import { releveStatus, daysSince } from "./releveStatus";

// Tri par urgence : les sites les plus en retard d'abord (rouge > orange > vert),
// et au sein d'un même statut, du plus ancien relevé au plus récent. Les sites
// jamais relevés remontent tout en haut. Départage stable via sortSites.
const STATUS_RANK = { red: 0, orange: 1, green: 2 };

export function sortSitesByStatus(list, lastBySite) {
  const base = sortSites(list); // ordre stable de repli
  const rank = new Map(base.map((s, i) => [s.id, i]));
  return base.slice().sort((a, b) => {
    const la = lastBySite?.[a.id];
    const lb = lastBySite?.[b.id];
    const ra = STATUS_RANK[releveStatus(la)];
    const rb = STATUS_RANK[releveStatus(lb)];
    if (ra !== rb) return ra - rb;
    // Plus ancien d'abord ; jamais relevé = le plus urgent.
    const da = la ? daysSince(la) : Infinity;
    const db = lb ? daysSince(lb) : Infinity;
    if (da !== db) return db - da;
    return rank.get(a.id) - rank.get(b.id);
  });
}

// Tri des sites : selon l'ordre du tableau (champ order), les sites ajoutés
// à la main (sans order) passent à la fin, dans leur ordre d'ajout. On trie
// sur la date de création (stable) et non sur le nom : ainsi un site ne change
// jamais de position quand on le renomme.
export function sortSites(list) {
  return list.slice().sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    const ac = a.createdAt || "";
    const bc = b.createdAt || "";
    if (ac !== bc) return ac.localeCompare(bc);
    // Départage final sur l'id (unique, immuable) : garantit un ordre
    // strictement déterministe même quand plusieurs sites ont la même date
    // de création (cas des sites importés en une seule fois). Sans ça,
    // l'ordre dépendait de la base et changeait après une modification.
    return a.id.localeCompare(b.id);
  });
}
