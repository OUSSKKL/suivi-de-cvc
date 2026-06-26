export function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}
