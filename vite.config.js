import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/suivi-de-cvc/", // l'app est servie sous ce sous-dossier sur GitHub Pages
  plugins: [react()],
  server: {
    host: true, // accessible depuis le réseau local (ex: ton téléphone)
  },
});
