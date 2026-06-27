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
