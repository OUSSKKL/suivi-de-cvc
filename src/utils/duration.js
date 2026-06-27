// Durée d'une intervention à partir des heures "HH:MM" de début et de fin.
// Gère le passage de minuit (fin < début => +24h), fréquent en astreinte.
export function durationHours(startTime, endTime) {
  if (!startTime || !endTime) return 0;
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return mins / 60;
}

// Met en forme un nombre d'heures décimal en "2h" ou "2h30".
export function formatDuration(hoursDecimal) {
  const totalMin = Math.round(hoursDecimal * 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}
