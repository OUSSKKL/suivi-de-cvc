// Tri des sites : selon l'ordre du tableau (champ order), les sites ajoutés
// à la main (sans order) passent à la fin, dans leur ordre d'ajout. On trie
// sur la date de création (stable) et non sur le nom : ainsi un site ne change
// jamais de position quand on le renomme.
export function sortSites(list) {
  return list.slice().sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    return (a.createdAt || "").localeCompare(b.createdAt || "");
  });
}
