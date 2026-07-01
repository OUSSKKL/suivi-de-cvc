import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseConfigured, supabase } from "./lib/supabaseClient";
import * as db from "./lib/db";
import { setSiteCoord } from "./utils/siteLocations";
import SiteListView from "./components/sites/SiteListView";
import TableauView from "./components/tableaux/TableauView";
import KitsTableView from "./components/tableaux/KitsTableView";
import ChaudieresTableView from "./components/tableaux/ChaudieresTableView";
import SiteDetailView from "./components/sites/SiteDetailView";
import AstreinteView from "./components/astreinte/AstreinteView";
import MapView from "./components/map/MapView";
import SavView from "./components/sav/SavView";
import FournisseurView from "./components/fournisseur/FournisseurView";
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
  const prevUserId = useRef(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      prevUserId.current = data.session?.user?.id ?? null;
      setSession(data.session);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      const newUserId = newSession?.user?.id ?? null;
      setSession(newSession);
      // On ne repart d'un état vierge QUE si l'utilisateur change vraiment
      // (connexion/déconnexion ou autre compte). Sur mobile, l'app perd et
      // reprend le focus souvent, ce qui déclenche des rafraîchissements de
      // jeton (TOKEN_REFRESHED) avec le MÊME utilisateur : inutile de tout
      // recharger à chaque fois (ça provoquait un spinner et un re-tri).
      if (prevUserId.current !== newUserId) {
        prevUserId.current = newUserId;
        setSites(null);
        setActiveSiteId(null);
        setView("list");
        setSearch("");
        window.history.replaceState({ view: "list", activeSiteId: null }, "");
      }
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

  async function addSite(name, coords) {
    const clean = name.trim().toUpperCase();
    const site = await db.createSite(clean, "");
    if (coords) setSiteCoord(clean, coords); // emplacement confirmé → carte
    setSites((prev) => [...prev, site]); // updater fonctionnel : ajout en série OK (scan)
    showToast("Site ajouté");
    return site.id;
  }

  async function editSite(id, name) {
    const clean = name.trim().toUpperCase();
    setSites(sites.map((s) => (s.id === id ? { ...s, name: clean } : s)));
    await db.updateSiteName(id, clean);
    showToast("Site modifié");
  }

  async function saveRemark(id, remark) {
    setSites((prev) => prev.map((s) => (s.id === id ? { ...s, remark } : s)));
    await db.updateSiteRemark(id, remark);
    showToast("Remarque enregistrée");
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
      <div className="min-h-screen bg-[#0c0e10] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-[#272d32] border-t-[#2b7fff] animate-spin" />
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
            className="btn-accent font-semibold text-sm px-4 py-2.5 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (sites === null) {
    return (
      <div className="min-h-screen bg-[#0c0e10] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-[#272d32] border-t-[#2b7fff] animate-spin" />
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
          onShowAstreinte={() => navigateTo("astreinte")}
          onShowMap={() => navigateTo("map")}
          onShowSav={() => navigateTo("sav")}
          onShowFournisseur={() => navigateTo("fournisseur")}
          onLogout={() => supabase.auth.signOut()}
        />
      )}

      {view === "tableau" && <TableauView sites={sites} onBack={goBack} />}

      {view === "kits" && <KitsTableView sites={sites} onBack={goBack} />}

      {view === "chaudieres" && (
        <ChaudieresTableView sites={sites} onBack={goBack} />
      )}

      {view === "astreinte" && <AstreinteView onBack={goBack} showToast={showToast} />}

      {view === "map" && <MapView sites={sites} onBack={goBack} />}

      {view === "sav" && <SavView onBack={goBack} />}

      {view === "fournisseur" && <FournisseurView onBack={goBack} />}

      {view === "site" && activeSite && (
        <SiteDetailView
          site={activeSite}
          tab={tab}
          setTab={setTab}
          onBack={goBack}
          showToast={showToast}
          onKitsChange={(kits) => updateKits(activeSite.id, kits)}
          onRename={(name) => editSite(activeSite.id, name)}
          onSaveRemark={(remark) => saveRemark(activeSite.id, remark)}
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
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-[#1f2428] border border-[#3a4147] text-[#ffffff] text-sm px-4 py-2.5 rounded-lg shadow-lift z-50 font-medium animate-slide-up flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2b7fff]" />
          {toast}
        </div>
      )}
    </div>
  );
}
