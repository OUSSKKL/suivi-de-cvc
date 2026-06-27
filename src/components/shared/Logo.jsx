// Logo Suivi CVC : image officielle (compteur + coche bleue).
// `import.meta.env.BASE_URL` garantit le bon chemin sous GitHub Pages (sous-dossier).
const LOGO_SRC = `${import.meta.env.BASE_URL}logo.png`;

export default function Logo({ size = 40, className = "", rounded = "rounded-xl" }) {
  return (
    <img
      src={LOGO_SRC}
      width={size}
      height={size}
      alt="Suivi CVC"
      className={`${rounded} ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
