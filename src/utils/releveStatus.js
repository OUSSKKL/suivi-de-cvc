// Statut (couleur) d'un site selon l'ancienneté de son dernier relevé.
export const STATUS_COLORS = {
  red: "#ff5d5d",
  orange: "#ff8a3d",
  green: "#22c55e",
};

export function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr + "T00:00:00").getTime()) / 86400000);
}

export function releveStatus(lastDate) {
  if (!lastDate) return "red";
  const days = daysSince(lastDate);
  if (days > 30) return "red";
  if (days > 15) return "orange";
  return "green";
}
