// Logo d'un client (bailleur) dans une pastille blanche arrondie.
// Les fichiers sont dans public/logos/. Client inconnu → initiales.
const LOGOS = {
  RIVP: "rivp.png",
  CDC: "cdc.svg",
  "1001 VIES": "1001vies.svg",
  ELOGIE: "elogie.svg",
  SSDH: "ssdh.png",
};

export default function ClientLogo({ client, size = 40 }) {
  const key = (client || "").trim().toUpperCase();
  const file = LOGOS[key];
  const box = { width: size, height: size };

  if (file) {
    return (
      <span
        className="shrink-0 rounded-lg bg-white flex items-center justify-center overflow-hidden"
        style={{ ...box, padding: Math.round(size * 0.1) }}
      >
        <img
          src={`${import.meta.env.BASE_URL}logos/${file}`}
          alt={key}
          className="max-w-full max-h-full object-contain"
          draggable={false}
        />
      </span>
    );
  }

  // Pas de logo : initiales (ou "?" si aucun client).
  const initials = key ? key.replace(/[^A-Z0-9 ]/g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 3) : "?";
  return (
    <span
      className="shrink-0 rounded-lg bg-[#272d32] text-[#c2c8cd] font-bold flex items-center justify-center"
      style={{ ...box, fontSize: Math.round(size * 0.32) }}
    >
      {key.length <= 4 && key ? key : initials}
    </span>
  );
}
