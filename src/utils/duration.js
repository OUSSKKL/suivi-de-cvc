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

// ---------- Heures majorées (astreinte) ----------
// Règle appliquée (modifiable ici) :
//  - 200 % : heures effectuées un dimanche ou un jour férié ;
//  - 125 % : toutes les autres heures d'astreinte.
// Une intervention qui passe minuit est découpée : chaque partie compte
// selon le jour où elle est réellement effectuée.

// Date de Pâques (algorithme de Meeus/Jones/Butcher).
function easter(year) {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const ymd = (d) => d.toISOString().slice(0, 10);
const holidayCache = {};

// Jours fériés en France (métropole) pour une année, au format "AAAA-MM-JJ".
export function joursFeries(year) {
  if (holidayCache[year]) return holidayCache[year];
  const fixed = ["01-01", "05-01", "05-08", "07-14", "08-15", "11-01", "11-11", "12-25"].map((md) => `${year}-${md}`);
  const e = easter(year).getTime();
  const plus = (days) => ymd(new Date(e + days * 86400000));
  const set = new Set([...fixed, plus(1), plus(39), plus(50)]); // lundi de Pâques, Ascension, lundi de Pentecôte
  holidayCache[year] = set;
  return set;
}

// Jour "à 200 %" : dimanche ou jour férié. dateStr = "AAAA-MM-JJ".
export function isJour200(dateStr) {
  const d = new Date(dateStr + "T00:00:00Z");
  return d.getUTCDay() === 0 || joursFeries(d.getUTCFullYear()).has(dateStr);
}

// Répartit la durée d'une intervention entre heures à 125 % et à 200 %.
export function heuresMajorees(dateStr, startTime, endTime) {
  const total = durationHours(startTime, endTime);
  if (!dateStr || !total) return { h125: 0, h200: 0 };
  const [sh, sm] = startTime.split(":").map(Number);
  const startMin = sh * 60 + sm;
  // Partie le jour même (jusqu'à minuit), puis le reste le lendemain.
  const jour1 = Math.min(total * 60, 24 * 60 - startMin) / 60;
  const jour2 = total - jour1;
  const next = ymd(new Date(new Date(dateStr + "T00:00:00Z").getTime() + 86400000));
  let h125 = 0, h200 = 0;
  if (isJour200(dateStr)) h200 += jour1; else h125 += jour1;
  if (jour2 > 0) {
    if (isJour200(next)) h200 += jour2; else h125 += jour2;
  }
  return { h125, h200 };
}
