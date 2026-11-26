import { useEffect, useRef, useState, useCallback, useMemo, type ReactElement } from "react";
import ProfilePage from './ProfilePage';
import FavoritesPage from './FavoritesPage';
import { supabase } from '../../auth/services/supabaseClient';
import { AuthUser } from '../../auth/services/authService';
import { Icon, TYPE_ICON, typeGlyphMarkup } from '../components/Icon';
import Sidebar from '../components/Sidebar';
import { SIDEBAR_STYLES } from '../styles/sidebar';
import {
  Spot,
  SpotTypeFilter,
  TYPE_COLOR,
  TYPE_GRADIENT,
  TYPE_LABEL,
  toSpots,
  sortSpots,
  SpotSort,
} from '../domain/spot';
import {
  DiscoveryNav,
  SpotsState,
  LocationState,
  FavoritesState,
  emptySpotsState,
  emptyFavoritesState,
  isFavoritePending,
} from '../machines/discovery';
import { locateUser, LocationError } from '../domain/geolocation';

// ── Types ─────────────────────────────────────────────────────
interface HomePageProps {
  onLogout:     () => void;
  user:         AuthUser;
  onUserUpdate: (u: AuthUser) => void;
}

const BASE_URL = "";

const FILTERS: { id: SpotTypeFilter; label: string; icon: ReactElement }[] = [
  { id: "all",        label: "All",         icon: <Icon.MapPin /> },
  { id: "cafe",       label: "Cafes",       icon: <TYPE_ICON.cafe /> },
  { id: "restaurant", label: "Restaurants", icon: <TYPE_ICON.restaurant /> },
  { id: "bar",        label: "Bars",        icon: <TYPE_ICON.bar /> },
];

const FILTER_TITLE: Record<SpotTypeFilter, string> = {
  all: "Discover Places",
  cafe: "Cafes",
  restaurant: "Restaurants",
  bar: "Bars",
};

// ── Styles ────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream:    #FAF7F2;
    --espresso: #1E1208;
    --latte:    #C8A97E;
    --steam:    #EDE8E0;
    --accent:   #C56A3D;
    --muted:    #9A8070;
    --sidebar-w: 68px;
    --glass-bg: rgba(255,255,255,0.85);
    --glass-blur: blur(12px);
    --card-height: 130px;
  }

  html, body, #root { height: 100%; font-family: 'DM Sans', sans-serif; background: var(--cream); }

  /* ── Layout ── */
  .home-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; }

  /* ── Results Panel ── */
  .results-panel {
    width: 360px; height: 100%; background: var(--cream);
    border-right: 1px solid var(--steam); display: flex;
    flex-direction: column; flex-shrink: 0; overflow: hidden;
    position: relative; z-index: 10;
  }

  .results-header {
    padding: 20px 16px 12px;
    border-bottom: 1px solid var(--steam);
    background: var(--cream);
    flex-shrink: 0;
  }

  .results-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem; font-weight: 700;
    color: var(--espresso); margin-bottom: 4px;
  }

  .results-subtitle { font-size: 0.75rem; color: var(--muted); }

  .results-list {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }
  .results-list::-webkit-scrollbar { width: 4px; }
  .results-list::-webkit-scrollbar-track { background: transparent; }
  .results-list::-webkit-scrollbar-thumb { background: var(--steam); border-radius: 2px; }

  /* ── Result Card - FIXED CONSISTENT SIZE ── */
  .result-card {
    background: white;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(30,18,8,0.06);
    height: 130px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .result-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(30,18,8,0.1);
    border-color: var(--steam);
  }
  .result-card.selected {
    border-color: var(--accent);
    box-shadow: 0 4px 16px rgba(197,106,61,0.15);
  }

  .result-card-top {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 8px;
    min-height: 44px;
  }

  .result-type-badge {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .result-type-badge svg { width: 18px; height: 18px; }

  .result-info {
    flex: 1;
    min-width: 0;
  }

  .result-name {
    font-family: 'Playfair Display', serif;
    font-size: 0.95rem; font-weight: 700;
    color: var(--espresso);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .result-type-label {
    font-size: 0.68rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    line-height: 1.2;
  }

  .result-open-badge {
    font-size: 0.62rem;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 20px;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .result-open-badge.open { background: #EDFAF3; color: #1A7A4A; }
  .result-open-badge.closed { background: #F5F5F5; color: #888; }
  .result-open-badge.unknown { background: #FFF4E0; color: #8A5A20; }

  .result-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
    flex-wrap: wrap;
  }

  .result-rating {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--espresso);
    white-space: nowrap;
  }
  .result-rating svg { width: 11px; height: 11px; color: #F5A623; }

  .result-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--muted);
    flex-shrink: 0;
  }

  .result-distance,
  .result-reviews {
    font-size: 0.72rem;
    color: var(--muted);
    white-space: nowrap;
  }

  .result-address {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .result-address svg {
    width: 10px;
    height: 10px;
    flex-shrink: 0;
  }

  /* ── Map Area ── */
  .map-area { flex: 1; position: relative; overflow: hidden; }
  #map { width: 100%; height: 100%; }

  /* ── Search bar (glassmorphism) ── */
  .search-bar {
    position: absolute; top: 16px; left: 16px; right: 16px;
    z-index: 900; display: flex; align-items: center; gap: 10px;
  }

  .search-input-wrap {
    flex: 1; max-width: 440px;
    background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border-radius: 14px; box-shadow: 0 4px 24px rgba(30,18,8,0.12);
    display: flex; align-items: center; padding: 0 14px; gap: 10px;
    border: 1.5px solid rgba(255,255,255,0.6);
    transition: all 0.2s ease;
  }
  .search-input-wrap:focus-within {
    border-color: var(--accent); box-shadow: 0 4px 24px rgba(30,18,8,0.12), 0 0 0 3px rgba(197,106,61,0.1);
    background: white;
  }
  .search-input-wrap svg { width: 16px; height: 16px; color: var(--muted); flex-shrink: 0; }
  .search-input {
    flex: 1; border: none; outline: none; padding: 13px 0;
    font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
    color: var(--espresso); background: transparent;
  }
  .search-input::placeholder { color: #C4B5A8; }

  .clear-btn {
    background: none; border: none; cursor: pointer; color: var(--muted);
    padding: 4px; border-radius: 50%; display: flex; transition: all 0.15s;
  }
  .clear-btn:hover { background: var(--steam); color: var(--espresso); }
  .clear-btn svg { width: 14px; height: 14px; }

  .locate-btn {
    background: var(--espresso); color: var(--latte); border: none;
    border-radius: 12px; padding: 11px 16px; cursor: pointer;
    font-size: 0.8rem; font-weight: 600; font-family: 'DM Sans', sans-serif;
    display: flex; align-items: center; gap: 6px;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(30,18,8,0.25);
    white-space: nowrap;
  }
  .locate-btn:hover { background: #3d2510; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,18,8,0.3); }
  .locate-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
  .locate-btn svg { width: 14px; height: 14px; }

  /* ── Filter pills (glassmorphism) ── */
  .filter-pills {
    position: absolute; top: 70px; left: 16px;
    z-index: 900; display: flex; gap: 8px;
  }

  .pill {
    display: flex; align-items: center; gap: 6px;
    padding: 7px 14px; border-radius: 20px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 0.75rem; font-weight: 600;
    cursor: pointer; transition: all 0.2s ease; white-space: nowrap;
  }
  .pill svg { width: 13px; height: 13px; flex-shrink: 0; }
  .pill.inactive {
    background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    color: var(--muted); border: 1.5px solid rgba(255,255,255,0.6);
    box-shadow: 0 2px 8px rgba(30,18,8,0.08);
  }
  .pill.inactive:hover { background: white; color: var(--espresso); transform: translateY(-1px); }
  .pill.active {
    background: var(--espresso); color: var(--cream);
    box-shadow: 0 4px 12px rgba(30,18,8,0.2);
    transform: translateY(-1px);
  }

  /* ── Premium Info Card ── */
  .info-card {
    position: absolute; bottom: 24px; left: 16px; z-index: 900;
    background: white; border-radius: 20px; width: 320px;
    box-shadow: 0 16px 48px rgba(30,18,8,0.2);
    border: 1px solid rgba(237,232,224,0.8);
    animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
    overflow: hidden;
  }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }

  .info-card-image {
    width: 100%; height: 120px;
    display: flex; align-items: center; justify-content: center;
    font-size: 3.5rem; position: relative; flex-shrink: 0;
  }
  .info-card-image svg { width: 52px; height: 52px; color: white; }

  .info-card-body { padding: 16px 18px 18px; }

  .info-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }

  .info-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.2rem; font-weight: 700;
    color: var(--espresso); line-height: 1.2; flex: 1;
  }

  .info-card-open {
    font-size: 0.65rem; font-weight: 700; padding: 3px 9px;
    border-radius: 20px; flex-shrink: 0; margin-top: 3px; margin-left: 8px;
  }
  .info-card-open.open { background: #EDFAF3; color: #1A7A4A; }
  .info-card-open.closed { background: #F5F5F5; color: #888; }
  .info-card-open.unknown { background: #FFF4E0; color: #8A5A20; }

  .info-card-meta {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px;
    flex-wrap: wrap;
  }

  .info-card-rating {
    display: flex; align-items: center; gap: 3px;
    font-size: 0.8rem; font-weight: 600; color: var(--espresso);
  }
  .info-card-rating svg { width: 13px; height: 13px; color: #F5A623; }
  .info-meta-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--muted); }
  .info-card-type-label { font-size: 0.75rem; color: var(--muted); text-transform: capitalize; }
  .info-review-count { font-size: 0.72rem; color: var(--muted); }

  .info-card-address {
    font-size: 0.78rem; color: var(--muted);
    line-height: 1.4; margin-bottom: 14px;
    display: flex; align-items: flex-start; gap: 5px;
  }
  .info-card-address svg { width: 12px; height: 12px; flex-shrink: 0; margin-top: 2px; }

  .info-card-actions { display: flex; gap: 8px; }

  .card-btn {
    flex: 1; padding: 10px 8px; border-radius: 10px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 0.78rem; font-weight: 600;
    cursor: pointer; transition: all 0.15s ease;
    display: flex; align-items: center; justify-content: center; gap: 5px;
  }
  .card-btn svg { width: 13px; height: 13px; }
  .card-btn.primary { background: var(--espresso); color: var(--cream); }
  .card-btn.primary:hover { background: #3d2510; transform: translateY(-1px); }
  .card-btn.secondary { background: var(--steam); color: var(--espresso); }
  .card-btn.secondary:hover { background: var(--latte); color: white; }
  .card-btn.saved { background: var(--accent); color: var(--cream); }
  .card-btn.saved:hover { background: #e8845a; transform: translateY(-1px); }
  .card-btn:disabled { opacity: 0.6; cursor: wait; transform: none; }

  .close-card {
    position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px); border: none; cursor: pointer; color: var(--muted);
    padding: 6px; border-radius: 50%; display: flex; z-index: 1;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: all 0.15s;
  }
  .close-card:hover { background: white; color: var(--espresso); }
  .close-card svg { width: 14px; height: 14px; stroke-width: 2.5; }

  /* ── Top Rated Widget ── */
  .top-rated-widget {
    position: absolute; top: 70px; right: 16px; z-index: 900;
    background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    -webkit-backdrop-filter: var(--glass-blur);
    border: 1.5px solid rgba(255,255,255,0.6);
    border-radius: 14px; padding: 10px 14px;
    box-shadow: 0 4px 20px rgba(30,18,8,0.1); min-width: 200px;
  }
  .top-rated-label {
    font-size: 0.62rem; font-weight: 700; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--accent); margin-bottom: 6px;
    display: flex; align-items: center; gap: 4px;
  }
  .top-rated-label svg { width: 10px; height: 10px; }
  .top-rated-item { display: flex; align-items: center; gap: 8px; }
  .top-rated-icon { display: flex; color: var(--accent); flex-shrink: 0; }
  .top-rated-icon svg { width: 18px; height: 18px; }
  .top-rated-info { flex: 1; min-width: 0; }
  .top-rated-name {
    font-size: 0.8rem; font-weight: 600; color: var(--espresso);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .top-rated-score { font-size: 0.7rem; color: var(--muted); display: flex; align-items: center; gap: 3px; }
  .top-rated-score svg { width: 10px; height: 10px; color: #F5A623; }

  /* ── Nearby chip ── */
  .nearby-chip {
    position: absolute; bottom: 24px; right: 16px; z-index: 900;
    background: var(--espresso); color: var(--cream);
    border-radius: 14px; padding: 10px 18px;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 4px 20px rgba(30,18,8,0.3); font-size: 0.78rem;
  }
  .nearby-chip-dot {
    width: 7px; height: 7px; border-radius: 50%; background: var(--accent);
    animation: pulse 2s ease-in-out infinite; flex-shrink: 0;
  }
  @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(197,106,61,0.5)} 50%{box-shadow:0 0 0 6px rgba(197,106,61,0)} }
  .nearby-chip-count {
    font-family: 'Playfair Display', serif; font-size: 1.2rem;
    font-weight: 700; color: var(--latte);
  }

  /* ── Loading overlay ── */
  .loading-overlay {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    z-index: 950; background: var(--glass-bg); backdrop-filter: var(--glass-blur);
    border-radius: 18px; padding: 20px 28px;
    box-shadow: 0 8px 32px rgba(30,18,8,0.15);
    display: flex; align-items: center; gap: 12px;
    font-size: 0.875rem; color: var(--espresso); border: 1px solid rgba(255,255,255,0.6);
  }

  .spinner {
    width: 20px; height: 20px; border: 2px solid var(--steam);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Error toast ── */
  .error-toast {
    position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
    z-index: 950; background: #FEF0EE; border: 1px solid #F5C6BC;
    border-radius: 12px; padding: 10px 18px; font-size: 0.82rem;
    color: #C0392B; box-shadow: 0 4px 16px rgba(197,106,61,0.15);
    cursor: pointer;
    display: flex; align-items: center; gap: 7px;
  }
  .error-toast svg { width: 13px; height: 13px; flex-shrink: 0; }
  .toast-retry {
    margin-left: 6px; padding: 3px 8px; border-radius: 6px;
    border: 1px solid #C0392B; background: transparent;
    color: #C0392B; font: inherit; font-weight: 600; cursor: pointer;
  }
  .toast-retry:hover { background: #F5C6BC; }

  /* ── Skeleton - FIXED CONSISTENT SIZE ── */
  .skeleton-card {
    background: white;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 10px;
    height: 130px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .skeleton {
    background: linear-gradient(90deg, #f0ebe4 25%, #e8e0d6 50%, #f0ebe4 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
  }
  .skeleton-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    flex-shrink: 0;
  }
  .skeleton-line {
    height: 12px;
    border-radius: 6px;
  }
  .skeleton-line-sm {
    height: 10px;
    border-radius: 5px;
  }
  .skeleton-card-content {
    display: flex;
    gap: 10px;
  }
  .skeleton-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Custom map markers ── */
  .map-marker-wrap {
    display: flex; flex-direction: column; align-items: center;
  }
  .map-marker {
    width: 36px; height: 36px; border-radius: 50%; border: 2.5px solid white;
    display: flex; align-items: center; justify-content: center;
    font-size: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
    cursor: pointer; transition: all 0.2s ease;
  }
  .map-marker svg { width: 16px; height: 16px; }
  .map-marker:hover { transform: scale(1.15); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
  .map-marker.selected { transform: scale(1.2); box-shadow: 0 8px 24px rgba(0,0,0,0.35); border-color: white; border-width: 3px; }

  /* ── Leaflet overrides ── */
  .marker-tooltip {
    background: var(--espresso) !important; color: var(--cream) !important;
    border: none !important; border-radius: 8px !important;
    font-family: 'DM Sans', sans-serif !important; font-size: 0.72rem !important;
    padding: 5px 10px !important; box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
    font-weight: 500 !important;
  }
  .marker-tooltip::before { display: none !important; }
  .leaflet-control-zoom { border: none !important; border-radius: 14px !important; overflow: hidden; box-shadow: 0 4px 20px rgba(30,18,8,0.12) !important; }
  .leaflet-control-zoom a { background: white !important; color: var(--espresso) !important; border: none !important; font-size: 16px !important; width: 34px !important; height: 34px !important; line-height: 34px !important; }
  .leaflet-control-zoom a:hover { background: var(--steam) !important; }
  .leaflet-control-attribution { font-size: 10px !important; background: rgba(255,255,255,0.75) !important; }

  /* ── Page overlays (Profile / Favorites) ── */
  @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .page-overlay {
    position: fixed; inset: 0; z-index: 2000;
    animation: overlayFadeIn 0.18s ease both;
  }
`;

// ── Main Component ─────────────────────────────────────────────
export default function HomePage({ onLogout, user, onUserUpdate }: HomePageProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarker = useRef<any>(null);

  // ── State (one value per state machine) ─────────────────────
  const [nav,            setNav]            = useState<DiscoveryNav>("discover");
  const [filter,         setFilter]         = useState<SpotTypeFilter>("all");
  const [selectedSpot,   setSelectedSpot]   = useState<Spot | null>(null);
  const [search,         setSearch]         = useState("");
  const [leafletLoaded,  setLeafletLoaded]  = useState(false);
  const [spotsState,     setSpotsState]     = useState<SpotsState>(emptySpotsState);
  const [locationState,  setLocationState]  = useState<LocationState>({ status: "idle" });
  const [favoritesState, setFavoritesState] = useState<FavoritesState>(emptyFavoritesState);
  const [loggingOut,     setLoggingOut]     = useState(false);

  const spots = spotsState.spots;
  const isLoading = spotsState.status === "loading";
  const located = locationState.status === "located";

  /** The list order the subtitle promises: distance when we know where we are. */
  const sortMode: SpotSort = located ? "distance" : "rating";
  const visibleSpots = useMemo(() => sortSpots(spots, sortMode), [spots, sortMode]);

  const topRated = useMemo(() => {
    if (spots.length === 0) return null;
    return [...spots].sort((a, b) => b.rating - a.rating)[0];
  }, [spots]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    onLogout();
  };

  // ── Load Leaflet ───────────────────────────────────────────
  useEffect(() => {
    if ((window as any).L) { setLeafletLoaded(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => setLeafletLoaded(true);
    document.head.appendChild(script);
  }, []);

  // ── Render markers ────────────────────────────────────────
  const renderMarkers = useCallback((spotList: Spot[]) => {
    if (!leafletMap.current) return;
    const L = (window as any).L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    spotList.forEach(spot => {
      if (!spot.lat || !spot.lng) return;
      const color = TYPE_COLOR[spot.type];
      const html  = `
        <div class="map-marker-wrap">
          <div class="map-marker" style="background:${color}">
            ${typeGlyphMarkup(spot.type, "#ffffff")}
          </div>
        </div>`;
      const icon = L.divIcon({ html, className:"", iconSize:[36,36], iconAnchor:[18,36] });
      const marker = L.marker([spot.lat,spot.lng],{icon})
        .addTo(leafletMap.current)
        .bindTooltip(spot.name,{className:"marker-tooltip",direction:"top",offset:[0,-32]});
      marker.on("click",()=>{ setSelectedSpot(spot); leafletMap.current.panTo([spot.lat,spot.lng]); });
      markersRef.current.push(marker);
    });
  }, []);

  // Markers follow the (sorted) list.
  useEffect(() => {
    renderMarkers(visibleSpots);
  }, [visibleSpots, renderMarkers]);

  // ── API helpers ────────────────────────────────────────────

  /** Fetch JSON, throwing on a non-2xx response so failures are never silent. */
  const getJson = async (url: string, init?: RequestInit): Promise<any[]> => {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  };

  const postNearby = (lat: number, lng: number, type?: string) =>
    getJson(`${BASE_URL}/api/establishments/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude: lat, longitude: lng, radiusKm: 10, limit: 50, ...(type ? { type } : {}) }),
    });

  /**
   * The single entry point for loading places.
   *
   * Four near-identical fetch/map/error pipelines used to live side by side
   * (`fetchAll`, `fetchNearby`, `handleSearch`, `handleFilter`) and two of
   * them forgot to check `res.ok`, so a 500 silently produced an empty list
   * instead of an error.
   */
  const loadSpots = useCallback(async (
    run: () => Promise<any[]>,
    failureMessage: string,
  ) => {
    setSpotsState(prev => ({ status: "loading", spots: prev.spots }));
    try {
      const raw = await run();
      setSpotsState({ status: "ready", spots: toSpots(raw) });
    } catch {
      setSpotsState(prev => ({ status: "error", spots: prev.spots, message: failureMessage }));
    }
  }, []);

  const fetchAll = useCallback(
    () => loadSpots(() => getJson(`${BASE_URL}/api/establishments`), "Could not load places. Is the backend running?"),
    [loadSpots],
  );

  // ── Init map — runs once on load, never on overlay toggles ──
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMap.current) return;
    const L = (window as any).L;
    leafletMap.current = L.map(mapRef.current, {
      center: [10.3157, 123.8854],
      zoom: 13, zoomControl: true,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors", maxZoom: 19,
    }).addTo(leafletMap.current);
    setTimeout(() => leafletMap.current?.invalidateSize(), 100);
    fetchAll();
  }, [leafletLoaded, fetchAll]);

  // ── Recalculate map size when overlays close ───────────────
  useEffect(() => {
    if (nav === "discover" && leafletMap.current) {
      setTimeout(() => leafletMap.current?.invalidateSize(), 80);
    }
  }, [nav]);

  // ── Load favorites from Supabase ───────────────────────────
  useEffect(() => {
    const loadFavorites = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;
      const { data } = await supabase
        .from("favorites")
        .select("establishment_id")
        .eq("user_id", authUser.id);
      if (data) {
        setFavoritesState(prev => ({
          ...prev,
          ids: new Set(data.map((r: any) => Number(r.establishment_id))),
        }));
      }
    };
    loadFavorites();
  }, []);

  /**
   * Save / unsave a place.
   *
   * The write is optimistic so the tap registers instantly, and it is rolled
   * back if the database rejects it. The old version ignored the write
   * result entirely, so a failed save left the button showing "Saved" with
   * nothing stored.
   */
  const toggleFavorite = async (spot: Spot) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const wasFavorite = favoritesState.ids.has(spot.id);
    const previousIds = favoritesState.ids;
    const nextIds = new Set(previousIds);
    if (wasFavorite) nextIds.delete(spot.id);
    else nextIds.add(spot.id);

    setFavoritesState(prev => ({
      ...prev,
      ids: nextIds,
      pending: new Set(prev.pending).add(spot.id),
      error: "",
    }));

    const write = wasFavorite
      ? supabase.from("favorites").delete()
          .eq("user_id", authUser.id)
          .eq("establishment_id", spot.id)
      : supabase.from("favorites").insert({ user_id: authUser.id, establishment_id: spot.id });

    const { error } = await write;

    setFavoritesState(prev => {
      const pending = new Set(prev.pending);
      pending.delete(spot.id);
      if (error) {
        return {
          ids: previousIds,
          pending,
          error: "Could not update your saved places. Please try again.",
        };
      }
      return { ...prev, pending, error: "" };
    });
  };

  // ── Search / filter / locate ──────────────────────────────
  const handleSearch = async (q: string) => {
    setFilter("all");
    setSelectedSpot(null);
    if (!q.trim()) { await fetchAll(); return; }

    // The backend uses these to run a nearby Overpass query instead of a
    // slow worldwide one. Without a location it still works, just broadly.
    const params = new URLSearchParams({ q });
    if (locationState.status === "located") {
      params.set("lat", String(locationState.lat));
      params.set("lng", String(locationState.lng));
    }
    await loadSpots(
      () => getJson(`${BASE_URL}/api/establishments/search?${params.toString()}`),
      "Search failed.",
    );
  };

  const handleFilter = async (f: SpotTypeFilter) => {
    setFilter(f);
    setSelectedSpot(null);
    const type = f === "all" ? undefined : f;

    if (located) {
      await loadSpots(
        () => postNearby(locationState.lat, locationState.lng, type),
        "Could not find nearby places.",
      );
      return;
    }

    const url = f === "all"
      ? `${BASE_URL}/api/establishments`
      : `${BASE_URL}/api/establishments/type/${f}`;
    await loadSpots(() => getJson(url), "Filter failed.");
  };

  const handleLocate = async () => {
    setLocationState({ status: "locating" });

    try {
      const fix = await locateUser();
      setLocationState({ status: "located", lat: fix.lat, lng: fix.lng });

      if (leafletMap.current) {
        const L = (window as any).L;
        leafletMap.current.setView([fix.lat, fix.lng], 14);
        if (userMarker.current) userMarker.current.remove();
        const uIcon = L.divIcon({
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 6px rgba(74,144,226,0.25)"></div>`,
          className: "", iconSize: [16,16], iconAnchor: [8,8],
        });
        userMarker.current = L.marker([fix.lat,fix.lng],{icon:uIcon})
          .addTo(leafletMap.current)
          .bindTooltip(fix.approximate ? "Approximate location" : "You are here",
            {className:"marker-tooltip",direction:"top",offset:[0,-12]});
      }

      await loadSpots(
        () => postNearby(fix.lat, fix.lng, filter === "all" ? undefined : filter),
        "Could not find nearby places.",
      );
    } catch (error) {
      const reason = error instanceof LocationError ? error.reason : "unknown";
      setLocationState({
        status: reason === "timeout" ? "timeout" : "unavailable",
        message: error instanceof LocationError
          ? error.message
          : "Could not determine your location.",
      });
    }
  };

  // ── Nav helper ─────────────────────────────────────────────
  const handleNav = (id: DiscoveryNav) => setNav(id);

  // ── Overlay close helper ───────────────────────────────────
  const closeOverlay = () => setNav("discover");

  const toastMessage =
      spotsState.status === "error"   ? spotsState.message
    : locationState.status === "unavailable" ? locationState.message
    : locationState.status === "timeout"    ? locationState.message
    : favoritesState.error          ? favoritesState.error
    : "";

  const dismissToast = () => {
    if (spotsState.status === "error") setSpotsState(prev => ({ status: "ready", spots: prev.spots }));
    if (locationState.status === "unavailable" || locationState.status === "timeout") {
      setLocationState({ status: "idle" });
    }
    if (favoritesState.error) setFavoritesState(prev => ({ ...prev, error: "" }));
  };

  return (
    <>
      <style>{styles}</style>
      <style>{SIDEBAR_STYLES}</style>

      {/* ── Main app — always mounted so the map is never destroyed ── */}
      <div className="home-container">

        {/* ── Sidebar ── */}
        <Sidebar
          active={nav}
          onNavigate={handleNav}
          onLogout={handleLogout}
          loggingOut={loggingOut}
        />

        {/* ── Results Panel ── */}
        <div className="results-panel">
          <div className="results-header">
            <div className="results-title">{FILTER_TITLE[filter]}</div>
            <div className="results-subtitle">
              {spots.length} place{spots.length !== 1 ? "s" : ""} found
              {located ? " · sorted by distance" : " · sorted by rating"}
            </div>
          </div>
          <div className="results-list">
            {isLoading ? (
              Array.from({length: 4}).map((_,i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-card-content">
                    <div className="skeleton skeleton-avatar"></div>
                    <div className="skeleton-card-info">
                      <div className="skeleton skeleton-line" style={{width: "70%"}}></div>
                      <div className="skeleton skeleton-line-sm" style={{width: "45%"}}></div>
                      <div className="skeleton skeleton-line-sm" style={{width: "60%"}}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : visibleSpots.map(spot => (
              <div key={spot.id}
                className={`result-card ${selectedSpot?.id===spot.id?"selected":""}`}
                onClick={() => { setSelectedSpot(spot); leafletMap.current?.panTo([spot.lat,spot.lng]); }}
              >
                <div className="result-card-top">
                  <div className="result-type-badge"
                    style={{background:`${TYPE_COLOR[spot.type]}20`, color:TYPE_COLOR[spot.type]}}>
                    {TYPE_ICON[spot.type]()}
                  </div>
                  <div className="result-info">
                    <div className="result-name">{spot.name}</div>
                    <div className="result-type-label">{TYPE_LABEL[spot.type]}</div>
                  </div>
                  <span className={`result-open-badge ${spot.openState}`}>
                    {spot.openState === "open" ? "Open" : spot.openState === "closed" ? "Closed" : "Hours unknown"}
                  </span>
                </div>
                <div className="result-meta">
                  <div className="result-rating">
                    <Icon.Star/> {spot.rating.toFixed(1)}
                  </div>
                  {spot.reviewCount > 0 && <>
                    <div className="result-dot"/>
                    <span className="result-reviews">{spot.reviewCount} reviews</span>
                  </>}
                  {spot.distance && <>
                    <div className="result-dot"/>
                    <span className="result-distance">{spot.distance}</span>
                  </>}
                </div>
                {spot.address && (
                  <div className="result-address">
                    <Icon.MapPin/> {spot.address}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Map ── */}
        <div className="map-area">
          <div id="map" ref={mapRef}/>

          {isLoading && (
            <div className="loading-overlay">
              <div className="spinner"/> <span>Finding places...</span>
            </div>
          )}

          {toastMessage && (
            <div className="error-toast" onClick={dismissToast}>
              <Icon.Alert/> <span>{toastMessage}</span>
              {(locationState.status === "timeout" || locationState.status === "unavailable") && (
                <button className="toast-retry"
                  onClick={e => { e.stopPropagation(); handleLocate(); }}>
                  Retry
                </button>
              )}
              <Icon.Close/>
            </div>
          )}

          {/* Search bar */}
          <div className="search-bar">
            <div className="search-input-wrap">
              <Icon.Search/>
              <input className="search-input"
                placeholder="Search cafes, restaurants…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleSearch(search)}
              />
              {search && (
                <button className="clear-btn" onClick={() => { setSearch(""); fetchAll(); }}>
                  <Icon.X/>
                </button>
              )}
            </div>
            <button className="locate-btn" onClick={handleLocate} disabled={locationState.status === "locating"}>
              <Icon.Locate/> {locationState.status === "locating" ? "Locating…" : "Near Me"}
            </button>
          </div>

          {/* Filter pills */}
          <div className="filter-pills">
            {FILTERS.map(f => (
              <button key={f.id}
                className={`pill ${filter===f.id?"active":"inactive"}`}
                onClick={() => handleFilter(f.id)}
              >
                {f.icon} {f.label}
              </button>
            ))}
          </div>

          {/* Top rated widget */}
          {topRated && !selectedSpot && (
            <div className="top-rated-widget"
              style={{cursor:"pointer"}}
              onClick={() => { setSelectedSpot(topRated); leafletMap.current?.panTo([topRated.lat,topRated.lng]); }}
            >
              <div className="top-rated-label"><Icon.Star/> Top Rated Nearby</div>
              <div className="top-rated-item">
                <span className="top-rated-icon">{TYPE_ICON[topRated.type]()}</span>
                <div className="top-rated-info">
                  <div className="top-rated-name">{topRated.name}</div>
                  <div className="top-rated-score">
                    <Icon.Star/> {topRated.rating.toFixed(1)} · {TYPE_LABEL[topRated.type]}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Premium info card */}
          {selectedSpot && (
            <div className="info-card">
              <button className="close-card" onClick={() => setSelectedSpot(null)}>
                <Icon.Close/>
              </button>
              <div className="info-card-image"
                style={{background: TYPE_GRADIENT[selectedSpot.type]}}>
                {TYPE_ICON[selectedSpot.type]()}
              </div>
              <div className="info-card-body">
                <div className="info-card-top">
                  <div className="info-card-name">{selectedSpot.name}</div>
                  <span className={`info-card-open ${selectedSpot.openState}`}>
                    {selectedSpot.openState === "open" ? "Open" : selectedSpot.openState === "closed" ? "Closed" : "Hours unknown"}
                  </span>
                </div>
                <div className="info-card-meta">
                  <div className="info-card-rating">
                    <Icon.Star/> {selectedSpot.rating.toFixed(1)}
                  </div>
                  {selectedSpot.reviewCount > 0 && <>
                    <div className="info-meta-dot"/>
                    <span className="info-review-count">{selectedSpot.reviewCount} reviews</span>
                  </>}
                  <div className="info-meta-dot"/>
                  <span className="info-card-type-label">{TYPE_LABEL[selectedSpot.type]}</span>
                  {selectedSpot.distance && <>
                    <div className="info-meta-dot"/>
                    <span className="info-review-count">{selectedSpot.distance}</span>
                  </>}
                </div>
                {selectedSpot.address && (
                  <div className="info-card-address">
                    <Icon.MapPin/> {selectedSpot.address}
                  </div>
                )}
                <div className="info-card-actions">
                  <button
                    className="card-btn primary"
                    onClick={() => {
                      const query = encodeURIComponent(
                        `${selectedSpot.name}${selectedSpot.address ? ", " + selectedSpot.address : ""}`
                      );
                      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
                    }}
                  >
                    <Icon.Navigate/> Directions
                  </button>
                  <button
                    className={`card-btn ${favoritesState.ids.has(selectedSpot.id) ? "saved" : "secondary"}`}
                    onClick={() => toggleFavorite(selectedSpot)}
                    disabled={isFavoritePending(favoritesState, selectedSpot.id)}
                  >
                    {favoritesState.ids.has(selectedSpot.id)
                      ? <><Icon.BookmarkFilled/> Saved</>
                      : <><Icon.Bookmark/> Save</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Nearby chip */}
          <div className="nearby-chip">
            <div className="nearby-chip-dot"/>
            <span>Showing</span>
            <span className="nearby-chip-count">{spots.length}</span>
            <span>places</span>
          </div>
        </div>
      </div>

      {/* ── Profile overlay — map stays alive underneath ── */}
      {nav === "profile" && (
        <div className="page-overlay">
          <ProfilePage
            user={user}
            onBack={closeOverlay}
            onUpdated={onUserUpdate}
          />
        </div>
      )}

      {/* ── Favorites overlay — map stays alive underneath ── */}
      {nav === "saved" && (
        <div className="page-overlay">
          <FavoritesPage
            user={user}
            favorites={favoritesState.ids}
            onNavigate={handleNav}
            onViewOnMap={(spot) => {
              closeOverlay();
              setSelectedSpot(spot);
              setTimeout(() => leafletMap.current?.panTo([spot.lat, spot.lng]), 120);
            }}
            onToggleFavorite={toggleFavorite}
            onLogout={onLogout}
          />
        </div>
      )}
    </>
  );
}
