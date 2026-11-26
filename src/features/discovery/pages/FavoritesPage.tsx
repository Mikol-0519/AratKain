import { useEffect, useState } from "react";
import { supabase } from "../../auth/services/supabaseClient";
import { AuthUser } from "../../auth/services/authService";
import { Icon, TYPE_ICON } from "../components/Icon";
import Sidebar from "../components/Sidebar";
import { SIDEBAR_STYLES } from "../styles/sidebar";
import {
  Spot,
  SpotTypeFilter,
  TYPE_GRADIENT,
  TYPE_LABEL,
  toSpots,
} from "../domain/spot";
import { DiscoveryNav } from "../machines/discovery";

// ── Types ──────────────────────────────────────────────────────
interface FavoritesPageProps {
  user:             AuthUser;
  favorites:        Set<number>;
  onNavigate:       (nav: DiscoveryNav) => void;
  onViewOnMap:      (spot: Spot) => void;
  onToggleFavorite: (spot: Spot) => void;
  onLogout:         () => void;
}

const BASE_URL = "";

// ── Styles ─────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream:     #FAF7F2;
    --espresso:  #1E1208;
    --latte:     #C8A97E;
    --steam:     #EDE8E0;
    --accent:    #C56A3D;
    --muted:     #9A8070;
    --sidebar-w: 68px;
  }

  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); }

  /* ── Layout ── */
  .fav-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

  /* ── Main content ── */
  .fav-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--cream); }

  /* ── Header ── */
  .fav-header {
    padding: 0 36px;
    background: white;
    border-bottom: 1px solid var(--steam);
    display: flex; align-items: center; gap: 20px;
    flex-shrink: 0;
    box-shadow: 0 1px 8px rgba(30,18,8,0.04);
  }

  .fav-header-inner {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 0;
    gap: 20px;
  }

  .fav-header-left {}

  .fav-breadcrumb {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--accent);
    margin-bottom: 4px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .fav-breadcrumb svg { width: 10px; height: 10px; }

  .fav-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--espresso);
    line-height: 1.1;
  }
  .fav-subtitle { font-size: 0.8rem; color: var(--muted); margin-top: 5px; }

  /* ── Header stats pills ── */
  .fav-header-stats {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
  }

  .fav-stat-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--cream);
    border: 1px solid var(--steam);
    border-radius: 12px;
  }

  .fav-stat-pill-icon {
    width: 30px; height: 30px;
    border-radius: 8px;
    background: var(--espresso);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fav-stat-pill-icon svg { width: 14px; height: 14px; color: var(--latte); stroke-width: 1.8; }

  .fav-stat-value {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--espresso);
    line-height: 1;
  }
  .fav-stat-label {
    font-size: 0.68rem;
    color: var(--muted);
    font-weight: 500;
    margin-top: 2px;
  }

  /* ── Filter tabs ── */
  .fav-filter-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 0 36px 0;
    margin-top: -1px;
    background: white;
    border-bottom: 1px solid var(--steam);
    flex-shrink: 0;
  }

  .fav-filter-tab {
    padding: 12px 18px;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.18s ease;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .fav-filter-tab:hover { color: var(--espresso); }
  .fav-filter-tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  .fav-filter-count {
    font-size: 0.65rem;
    background: var(--steam);
    color: var(--muted);
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 700;
  }
  .fav-filter-tab.active .fav-filter-count {
    background: rgba(197,106,61,0.12);
    color: var(--accent);
  }

  /* ── Scrollable grid area ── */
  .fav-grid-wrap { flex: 1; overflow-y: auto; padding: 28px 36px; }
  .fav-grid-wrap::-webkit-scrollbar { width: 4px; }
  .fav-grid-wrap::-webkit-scrollbar-track { background: transparent; }
  .fav-grid-wrap::-webkit-scrollbar-thumb { background: var(--steam); border-radius: 2px; }

  .fav-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  /* ── Favorite card ── */
  .fav-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    border: 1.5px solid var(--steam);
    transition: all 0.22s ease;
    box-shadow: 0 2px 12px rgba(30,18,8,0.06);
    display: flex;
    flex-direction: column;
  }
  .fav-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 36px rgba(30,18,8,0.13);
    border-color: rgba(200,169,126,0.4);
  }

  .fav-card-image {
    width: 100%; height: 140px;
    display: flex; align-items: center; justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .fav-card-image-icon {
    position: relative;
    z-index: 1;
    color: white;
    display: flex;
  }
  .fav-card-image-icon svg { width: 56px; height: 56px; }

  .fav-card-image-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%);
  }

  .fav-card-type-badge {
    position: absolute;
    top: 12px; left: 12px;
    font-size: 0.62rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding: 4px 10px;
    border-radius: 20px;
    background: rgba(255,255,255,0.18);
    backdrop-filter: blur(8px);
    color: white;
    border: 1px solid rgba(255,255,255,0.25);
    z-index: 2;
  }

  .fav-card-open-badge {
    position: absolute;
    top: 12px; right: 12px;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 20px;
    z-index: 2;
  }
  .fav-card-open-badge.open   { background: rgba(26,122,74,0.85); color: white; }
  .fav-card-open-badge.closed { background: rgba(0,0,0,0.45); color: rgba(255,255,255,0.7); }
  .fav-card-open-badge.unknown { background: rgba(138,90,32,0.85); color: white; }

  .fav-card-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; }

  .fav-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--espresso);
    line-height: 1.25;
    margin-bottom: 8px;
  }

  .fav-card-meta {
    display: flex; align-items: center; gap: 6px; margin-bottom: 10px;
  }
  .fav-card-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 0.78rem; font-weight: 700; color: var(--espresso);
  }
  .fav-card-rating svg { width: 12px; height: 12px; color: #F5A623; }
  .fav-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--steam); }
  .fav-card-reviews { font-size: 0.72rem; color: var(--muted); }

  .fav-card-address {
    font-size: 0.74rem; color: var(--muted); margin-bottom: 14px;
    display: flex; align-items: flex-start; gap: 5px; line-height: 1.45;
    flex: 1;
  }
  .fav-card-address svg { width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; stroke-width: 2; }

  .fav-card-actions { display: flex; gap: 8px; margin-top: auto; }
  .fav-action-btn {
    flex: 1; padding: 10px 10px; border-radius: 11px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 0.76rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s ease;
    display: flex; align-items: center; justify-content: center; gap: 6px;
  }
  .fav-action-btn svg { width: 13px; height: 13px; stroke-width: 2; }
  .fav-action-btn.primary  { background: var(--espresso); color: var(--cream); }
  .fav-action-btn.primary:hover  { background: #3d2510; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(30,18,8,0.2); }
  .fav-action-btn.danger   { background: #FEF0EE; color: #C0392B; border: 1px solid #FDDAD6; }
  .fav-action-btn.danger:hover   { background: #FDDAD6; transform: translateY(-1px); }

  /* ── Empty state ── */
  .fav-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 64px 24px; text-align: center;
  }
  .fav-empty-icon {
    width: 88px; height: 88px; border-radius: 24px;
    background: var(--steam);
    display: flex;
    align-items: center; justify-content: center; margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(30,18,8,0.08);
  }
  .fav-empty-icon svg { width: 40px; height: 40px; color: var(--muted); stroke-width: 1.4; }
  .fav-empty-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.4rem; font-weight: 700; color: var(--espresso);
    margin-bottom: 10px;
  }
  .fav-empty-text {
    font-size: 0.86rem; color: var(--muted);
    max-width: 280px; line-height: 1.7;
  }

  /* ── Loading skeletons ── */
  .skeleton {
    background: linear-gradient(90deg, #f0ebe4 25%, #e8e0d6 50%, #f0ebe4 75%);
    background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 6px;
  }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  .fav-skeleton-card { background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 2px 12px rgba(30,18,8,0.07); border: 1.5px solid var(--steam); }
  .fav-skeleton-image { height: 140px; border-radius: 0; }
  .fav-skeleton-body { padding: 16px 18px; }
`;

// ── Component ──────────────────────────────────────────────────
export default function FavoritesPage({
  user, favorites, onNavigate, onViewOnMap, onToggleFavorite, onLogout,
}: FavoritesPageProps) {
  const [spots,      setSpots]      = useState<Spot[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SpotTypeFilter>("all");

  // Re-fetch whenever the favorites set changes
  useEffect(() => {
    loadFavoriteSpots();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favorites]);

  const loadFavoriteSpots = async () => {
    if (favorites.size === 0) { setSpots([]); setLoading(false); return; }
    setLoading(true);
    try {
      const ids = Array.from(favorites);
      const results = await Promise.all(
        ids.map(id =>
          fetch(`${BASE_URL}/api/establishments/${id}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      setSpots(toSpots(results.filter(Boolean)));
    } catch {
      setSpots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    onLogout();
  };

  const openCount   = spots.filter(s => s.openState === "open").length;
  const cafeCount   = spots.filter(s => s.type === "cafe").length;
  const restCount   = spots.filter(s => s.type === "restaurant").length;
  const barCount    = spots.filter(s => s.type === "bar").length;
  const filteredSpots = activeFilter === "all" ? spots : spots.filter(s => s.type === activeFilter);

  const filterLabels: Record<SpotTypeFilter, string> = {
    all: "All Places", cafe: "Cafés", restaurant: "Restaurants", bar: "Bars",
  };

  return (
    <>
      <style>{styles}</style>
      <style>{SIDEBAR_STYLES}</style>
      <div className="fav-container">

        {/* ── Sidebar ── */}
        <Sidebar
          active="saved"
          onNavigate={onNavigate}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        {/* ── Main ── */}
        <div className="fav-main">

          {/* Header */}
          <div className="fav-header">
            <div className="fav-header-inner">
              <div className="fav-header-left">
                <div className="fav-breadcrumb">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                  </svg>
                  My Collection
                </div>
                <div className="fav-title">Saved Places</div>
                <div className="fav-subtitle">
                  {loading
                    ? "Loading your saved places…"
                    : `${spots.length} place${spots.length !== 1 ? "s" : ""} · ${user.username}`
                  }
                </div>
              </div>

              {!loading && spots.length > 0 && (
                <div className="fav-header-stats">
                  <div className="fav-stat-pill">
                    <div className="fav-stat-pill-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fav-stat-value">{spots.length}</div>
                      <div className="fav-stat-label">Saved</div>
                    </div>
                  </div>
                  <div className="fav-stat-pill">
                    <div className="fav-stat-pill-icon" style={{background: '#1A7A4A'}}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <div>
                      <div className="fav-stat-value">{openCount}</div>
                      <div className="fav-stat-label">Open Now</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Filter tabs */}
          {!loading && spots.length > 0 && (
            <div className="fav-filter-bar">
              {(["all", "cafe", "restaurant", "bar"] as const).map(tab => {
                const count = tab === "all" ? spots.length : tab === "cafe" ? cafeCount : tab === "restaurant" ? restCount : barCount;
                return (
                  <button
                    key={tab}
                    className={`fav-filter-tab ${activeFilter === tab ? "active" : ""}`}
                    onClick={() => setActiveFilter(tab)}
                  >
                    {filterLabels[tab]}
                    <span className="fav-filter-count">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="fav-grid-wrap">
              <div className="fav-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="fav-skeleton-card">
                    <div className="fav-skeleton-image skeleton"/>
                    <div className="fav-skeleton-body">
                      <div className="skeleton" style={{height:14, width:"70%", marginBottom:8}}/>
                      <div className="skeleton" style={{height:10, width:"45%", marginBottom:6}}/>
                      <div className="skeleton" style={{height:10, width:"60%", marginBottom:16}}/>
                      <div style={{display:"flex", gap:8}}>
                        <div className="skeleton" style={{height:36, flex:1, borderRadius:11}}/>
                        <div className="skeleton" style={{height:36, flex:1, borderRadius:11}}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : spots.length === 0 ? (
            <div className="fav-empty">
              <div className="fav-empty-icon"><Icon.Bookmark/></div>
              <div className="fav-empty-title">No saved places yet</div>
              <div className="fav-empty-text">
                Browse the map and tap <strong>Save</strong> on any place to build your collection.
              </div>
            </div>
          ) : (
            <div className="fav-grid-wrap">
              <div className="fav-grid">
                {filteredSpots.map(spot => (
                  <div key={spot.id} className="fav-card">
                    <div className="fav-card-image" style={{background: TYPE_GRADIENT[spot.type]}}>
                      <span className="fav-card-image-icon">{TYPE_ICON[spot.type]()}</span>
                      <div className="fav-card-image-overlay"/>
                      <span className="fav-card-type-badge">{TYPE_LABEL[spot.type]}</span>
                      <span className={`fav-card-open-badge ${spot.openState}`}>
                        {spot.openState === "open" ? "● Open" : spot.openState === "closed" ? "Closed" : "Hours unknown"}
                      </span>
                    </div>
                    <div className="fav-card-body">
                      <div className="fav-card-name">{spot.name}</div>
                      <div className="fav-card-meta">
                        <div className="fav-card-rating">
                          <Icon.Star/> {spot.rating.toFixed(1)}
                        </div>
                        {spot.reviewCount > 0 && <>
                          <div className="fav-meta-dot"/>
                          <span className="fav-card-reviews">{spot.reviewCount} reviews</span>
                        </>}
                      </div>
                      {spot.address && (
                        <div className="fav-card-address">
                          <Icon.MapPin/> {spot.address}
                        </div>
                      )}
                      <div className="fav-card-actions">
                        <button
                          className="fav-action-btn primary"
                          onClick={() => onViewOnMap(spot)}
                        >
                          <Icon.Navigate/> View on Map
                        </button>
                        <button
                          className="fav-action-btn danger"
                          onClick={() => onToggleFavorite(spot)}
                        >
                          <Icon.Trash/> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
