// Tri des sites : selon l'ordre du tableau (champ order), les sites ajoutés
// à la main (sans order) passent à la fin, triés par nom.
export function sortSites(list) {
  return list.slice().sort((a, b) => {
    const ao = a.order ?? Infinity;
    const bo = b.order ?? Infinity;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}
