import { useState, useEffect, useCallback } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import * as db from "./lib/db";
import SiteListView from "./components/sites/SiteListView";
import TableauView from "./components/tableaux/TableauView";
import KitsTableView from "./components/tableaux/KitsTableView";
import ChaudieresTableView from "./components/tableaux/ChaudieresTableView";
import SiteDetailView from "./components/sites/SiteDetailView";
import ConfirmModal from "./components/shared/ConfirmModal";
import SetupNeeded from "./components/SetupNeeded";
import Login from "./components/Login";

export default function App() {
  const [session, setSession] = useState(undefined); // undefined = loading, null = déconnecté
  const [sites, setSites] = useState(null); // null = loading
  const [activeSiteId, setActiveSiteId] = useState(null);
  const [view, setView] = useState("list"); // list | site
  const [tab, setTab] = useState("compteurs"); // compteurs | chaudieres | photos
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmDeleteSite, setConfirmDeleteSite] = useState(null);
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Repart d'un état propre à chaque changement de session : évite
      // d'afficher brièvement les données d'un autre compte si quelqu'un se
      // déconnecte puis qu'un autre utilisateur se connecte sur le même appareil.
      setSession(newSession);
      setSites(null);
      setActiveSiteId(null);
      setView("list");
      setSearch("");
      window.history.replaceState({ view: "list", activeSiteId: null }, "");
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const loadSites = useCallback(async () => {
    try {
      setConnectionError(false);
      const data = await db.listSites();
      setSites(data);
    } catch (e) {
      setConnectionError(true);
    }
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && session) loadSites();
  }, [session, loadSites]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  // Branche la navigation sur l'historique du navigateur : ça fait marcher
  // le bouton retour physique/du navigateur ET le geste de balayage natif
  // (Safari iOS notamment), qui s'appuient tous les deux sur cet historique.
  useEffect(() => {
    window.history.replaceState({ view: "list", activeSiteId: null }, "");
    function onPopState(e) {
      const state = e.state || { view: "list", activeSiteId: null };
      setView(state.view);
      setActiveSiteId(state.activeSiteId);
      if (state.view === "site") setTab("compteurs");
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigateTo(nextView, siteId = null) {
    window.history.pushState({ view: nextView, activeSiteId: siteId }, "");
    setView(nextView);
    setActiveSiteId(siteId);
    if (nextView === "site") setTab("compteurs");
  }

  function goBack() {
    window.history.back();
  }

  async function addSite(name, address) {
    const site = await db.createSite(name.trim(), address.trim());
    setSites([...sites, site]);
    showToast("Site ajouté");
    return site.id;
  }

  async function deleteSite(id) {
    await db.deleteSite(id);
    setSites(sites.filter((s) => s.id !== id));
    setConfirmDeleteSite(null);
    if (activeSiteId === id) {
      setActiveSiteId(null);
      setView("list");
      window.history.replaceState({ view: "list", activeSiteId: null }, "");
    }
    showToast("Site supprimé");
  }

  async function updateKits(id, kits) {
    setSites(sites.map((s) => (s.id === id ? { ...s, kits } : s)));
    await db.updateSiteKits(id, kits);
  }

  if (!isSupabaseConfigured) {
    return <SetupNeeded />;
  }

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-[#0c0e10] flex items-center justify-center">
        <div className="text-[#c2c8cd] text-sm font-mono tracking-wide">Chargement…</div>
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  if (connectionError) {
    return (
      <div className="min-h-screen bg-[#0c0e10] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-[#ff8a8a] font-semibold mb-2">Connexion impossible</p>
          <p className="text-[#aab3ba] text-sm mb-4">
            Impossible de joindre la base de données. Vérifie ta connexion internet puis réessaie.
          </p>
          <button
            onClick={loadSites}
            className="bg-[#ff8a3d] hover:bg-[#ff9d5c] text-[#1a1006] font-semibold text-sm px-4 py-2.5 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (sites === null) {
    return (
      <div className="min-h-screen bg-[#0c0e10] flex items-center justify-center">
        <div className="text-[#c2c8cd] text-sm font-mono tracking-wide">Chargement…</div>
      </div>
    );
  }

  const activeSite = sites.find((s) => s.id === activeSiteId) || null;
  const filteredSites = sites.filter((s) =>
    (s.name + " " + s.address).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#0c0e10", color: "#ffffff" }}>
      {view === "list" && (
        <SiteListView
          sites={filteredSites}
          allCount={sites.length}
          search={search}
          setSearch={setSearch}
          onOpen={(id) => navigateTo("site", id)}
          onAdd={addSite}
          onDelete={(id) => setConfirmDeleteSite(id)}
          onShowTableau={() => navigateTo("tableau")}
          onShowKits={() => navigateTo("kits")}
          onShowChaudieres={() => navigateTo("chaudieres")}
          onLogout={() => supabase.auth.signOut()}
        />
      )}

      {view === "tableau" && <TableauView sites={sites} onBack={goBack} />}

      {view === "kits" && <KitsTableView sites={sites} onBack={goBack} />}

      {view === "chaudieres" && (
        <ChaudieresTableView sites={sites} onBack={goBack} />
      )}

      {view === "site" && activeSite && (
        <SiteDetailView
          site={activeSite}
          tab={tab}
          setTab={setTab}
          onBack={goBack}
          showToast={showToast}
          onKitsChange={(kits) => updateKits(activeSite.id, kits)}
        />
      )}

      {confirmDeleteSite && (
        <ConfirmModal
          title="Supprimer ce site ?"
          message="Tous les relevés, fiches chaudières et photos liés seront supprimés définitivement."
          onCancel={() => setConfirmDeleteSite(null)}
          onConfirm={() => deleteSite(confirmDeleteSite)}
        />
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1f2428] border border-[#3a4147] text-[#ffffff] text-sm px-4 py-2.5 rounded-lg shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}
    </div>
  );
}
