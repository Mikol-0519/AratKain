import { useEffect, useRef, useState, useCallback } from "react";
import ProfilePage from './ProfilePage';
import FavoritesPage from "./FavoritesPage";
import { supabase } from '../services/supabaseClient';

// ── Types ─────────────────────────────────────────────────────
interface Spot {
  id:          number;
  name:        string;
  type:        "cafe" | "restaurant" | "bar";
  rating:      number;
  reviewCount: number;
  distance:    string;
  isOpen:      boolean;
  lat:         number;
  lng:         number;
  address:     string;
  description: string;
  phone:       string;
}

type NavItem    = "food" | "saved" | "profile";
type FilterType = "all" | "cafe" | "restaurant" | "bar";

interface HomePageProps {
  onLogout:     () => void;
  user:         { id: string; email: string; username: string; fullname: string };
  onUserUpdate: (u: { id: string; email: string; username: string; fullname: string }) => void;
}

const BASE_URL = "https://aratkain-backend.onrender.com";

const FILTERS: { id: FilterType; label: string; emoji: string }[] = [
  { id: "all",        label: "All",         emoji: "🗺️" },
  { id: "cafe",       label: "Cafes",       emoji: "☕" },
  { id: "restaurant", label: "Restaurants", emoji: "🍽️" },
  { id: "bar",        label: "Bars",        emoji: "🍸" },
];

const TYPE_EMOJI: Record<string, string> = {
  cafe: "☕", restaurant: "🍽️", bar: "🍸",
};

const TYPE_COLOR: Record<string, string> = {
  cafe: "#C56A3D", restaurant: "#2C1A0E", bar: "#8B5CF6",
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

  /* ── Sidebar ── */
  .sidebar {
    width: var(--sidebar-w); height: 100%;
    background: linear-gradient(180deg, #1E1208 0%, #2C1A0E 100%);
    display: flex; flex-direction: column; align-items: center;
    padding: 1.25rem 0; z-index: 1000; flex-shrink: 0;
    box-shadow: 4px 0 24px rgba(30,18,8,0.4);
  }

  .sidebar-brand {
    display: flex; flex-direction: column; align-items: center;
    gap: 4px; padding-bottom: 1.25rem; width: 100%;
    border-bottom: 1px solid rgba(200,169,126,0.12);
  }

  .brand-mark {
    width: 38px; height: 38px; border-radius: 10px;
    background: linear-gradient(135deg, var(--accent), #E8845A);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Playfair Display', serif; font-size: 1rem;
    font-weight: 900; color: white; letter-spacing: -0.03em;
    box-shadow: 0 4px 12px rgba(197,106,61,0.4);
  }

  .brand-name {
    font-family: 'Playfair Display', serif; font-size: 0.6rem;
    font-weight: 700; color: var(--latte); letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  .sidebar-nav { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 1rem; }

  .nav-btn {
    width: 46px; height: 46px; border-radius: 13px; border: none;
    background: transparent; color: rgba(200,169,126,0.4); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease; position: relative;
  }
  .nav-btn:hover { background: rgba(200,169,126,0.1); color: var(--latte); transform: translateX(2px); }
  .nav-btn.active { background: rgba(197,106,61,0.2); color: var(--accent); }
  .nav-btn.active::before {
    content: ''; position: absolute; left: -1px; top: 50%;
    transform: translateY(-50%); width: 3px; height: 22px;
    border-radius: 0 3px 3px 0; background: var(--accent);
  }
  .nav-btn svg { width: 20px; height: 20px; stroke-width: 1.8; }

  .sidebar-bottom { display: flex; flex-direction: column; align-items: center; gap: 6px; padding-bottom: 0.75rem; }

  .logout-btn {
    width: 46px; height: 46px; border-radius: 13px;
    border: 1px solid rgba(197,106,61,0.2); background: transparent;
    color: rgba(197,106,61,0.5); cursor: pointer;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; transition: all 0.2s ease;
  }
  .logout-btn:hover { background: rgba(197,106,61,0.12); color: var(--accent); border-color: rgba(197,106,61,0.4); }
  .logout-btn svg { width: 18px; height: 18px; stroke-width: 1.8; }
  .logout-btn span { font-size: 0.4rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }

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
    height: 130px; /* FIXED HEIGHT */
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

  .result-info { 
    flex: 1; 
    min-width: 0;
  }

  .result-name {
    font-family: 'Playfair Display', serif; 
    font-size: 0.95rem;
    font-weight: 700; 
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

  .info-card-body { padding: 16px 18px 18px; }

  .info-card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 6px; }

  .info-card-name {
    font-family: 'Playfair Display', serif; font-size: 1.2rem;
    font-weight: 700; color: var(--espresso); line-height: 1.2; flex: 1;
  }

  .info-card-open {
    font-size: 0.65rem; font-weight: 700; padding: 3px 9px;
    border-radius: 20px; flex-shrink: 0; margin-top: 3px; margin-left: 8px;
  }
  .info-card-open.open { background: #EDFAF3; color: #1A7A4A; }
  .info-card-open.closed { background: #F5F5F5; color: #888; }

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
    font-size: 0.78rem; color: var(--muted); line-height: 1.4;
    margin-bottom: 14px; display: flex; align-items: flex-start; gap: 5px;
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
  }
  .top-rated-item { display: flex; align-items: center; gap: 8px; }
  .top-rated-emoji { font-size: 1.1rem; }
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
    color: #C0392B; box-shadow: 0 4px 16px rgba(197,106,61,0.15); white-space: nowrap;
    cursor: pointer;
  }

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
  .leaflet-control-attribution { display: none !important; }

  /* ── Page overlays (Profile / Favorites) ── */
  @keyframes overlayFadeIn { from { opacity: 0; } to { opacity: 1; } }
  .page-overlay {
    position: fixed; inset: 0; z-index: 2000;
    animation: overlayFadeIn 0.18s ease both;
  }
`;

// ── Image gradient per type ────────────────────────────────────
const TYPE_GRADIENT: Record<string, string> = {
  cafe:       "linear-gradient(135deg, #3D1C08 0%, #8B4513 50%, #C56A3D 100%)",
  restaurant: "linear-gradient(135deg, #1A2744 0%, #2C3E6B 50%, #4A6FA5 100%)",
  bar:        "linear-gradient(135deg, #2D1B4E 0%, #6B3FA0 50%, #9B6FD0 100%)",
};

// ── Icons ──────────────────────────────────────────────────────
const Icon = {
  Food:           () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="22"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/></svg>,
  Bookmark:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  BookmarkFilled: () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  User:           () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Search:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Locate:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>,
  Star:           () => <svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  MapPin:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  Close:          () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  Navigate:       () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>,
  Logout:         () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  X:              () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ── Main Component ─────────────────────────────────────────────
export default function HomePage({ onLogout, user, onUserUpdate }: HomePageProps) {
  const mapRef     = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarker = useRef<any>(null);

  const [activeNav,     setActiveNav]     = useState<NavItem>("food");
  const [activeFilter,  setActiveFilter]  = useState<FilterType>("all");
  const [selectedSpot,  setSelectedSpot]  = useState<Spot | null>(null);
  const [search,        setSearch]        = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [spots,         setSpots]         = useState<Spot[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [locating,      setLocating]      = useState(false);
  const [error,         setError]         = useState("");
  const [showProfile,   setShowProfile]   = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [loggingOut,    setLoggingOut]    = useState(false);
  const [userLat,       setUserLat]       = useState<number | null>(null);
  const [userLng,       setUserLng]       = useState<number | null>(null);
  const [favorites,     setFavorites]     = useState<Set<number>>(new Set());

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletLoaded]);

  // ── Recalculate map size when overlays close ───────────────
  useEffect(() => {
    if (!showProfile && !showFavorites && leafletMap.current) {
      setTimeout(() => leafletMap.current?.invalidateSize(), 80);
    }
  }, [showProfile, showFavorites]);

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
        setFavorites(new Set(data.map((r: any) => Number(r.establishment_id))));
      }
    };
    loadFavorites();
  }, []);

  const toggleFavorite = async (spot: Spot) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const isFaved = favorites.has(spot.id);
    const next = new Set(favorites);
    if (isFaved) {
      next.delete(spot.id);
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", authUser.id)
        .eq("establishment_id", spot.id);
    } else {
      next.add(spot.id);
      await supabase
        .from("favorites")
        .insert({ user_id: authUser.id, establishment_id: spot.id });
    }
    setFavorites(next);
  };

  // ── API helpers ────────────────────────────────────────────
  const fetchAll = async () => {
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/establishments`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped = toSpots(data);
      setSpots(mapped);
      renderMarkers(mapped);
    } catch {
      setError("Could not load places. Is the backend running?");
    } finally { setLoading(false); }
  };

  const fetchNearby = async (lat: number, lng: number, type?: string) => {
    setLoading(true); setError("");
    try {
      const body: any = { latitude: lat, longitude: lng, radiusKm: 10, limit: 50 };
      if (type) body.type = type;
      const res  = await fetch(`${BASE_URL}/api/establishments/nearby`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      const data   = await res.json();
      const mapped = toSpots(data);
      setSpots(mapped);
      renderMarkers(mapped);
    } catch { setError("Could not find nearby places."); }
    finally { setLoading(false); }
  };

  const handleSearch = async (q: string) => {
    if (!q.trim()) { fetchAll(); return; }
    setLoading(true); setError("");
    try {
      const res  = await fetch(`${BASE_URL}/api/establishments/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const mapped = toSpots(data);
      setSpots(mapped);
      renderMarkers(mapped);
    } catch { setError("Search failed."); }
    finally { setLoading(false); }
  };

  const handleFilter = async (f: FilterType) => {
    setActiveFilter(f); setSelectedSpot(null);
    if (userLat && userLng) { await fetchNearby(userLat, userLng, f === "all" ? undefined : f); return; }
    setLoading(true);
    try {
      const url  = f === "all" ? `${BASE_URL}/api/establishments` : `${BASE_URL}/api/establishments/type/${f}`;
      const res  = await fetch(url);
      const data = await res.json();
      const mapped = toSpots(data);
      setSpots(mapped);
      renderMarkers(mapped);
    } catch { setError("Filter failed."); }
    finally { setLoading(false); }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) { setError("Geolocation not supported."); return; }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude, lng = pos.coords.longitude;
        setUserLat(lat); setUserLng(lng);
        if (leafletMap.current) {
          const L = (window as any).L;
          leafletMap.current.setView([lat, lng], 14);
          if (userMarker.current) userMarker.current.remove();
          const uIcon = L.divIcon({
            html: `<div style="width:16px;height:16px;border-radius:50%;background:#4A90E2;border:3px solid white;box-shadow:0 0 0 6px rgba(74,144,226,0.25)"></div>`,
            className: "", iconSize: [16,16], iconAnchor: [8,8],
          });
          userMarker.current = L.marker([lat,lng],{icon:uIcon}).addTo(leafletMap.current)
            .bindTooltip("You are here",{className:"marker-tooltip",direction:"top",offset:[0,-12]});
        }
        await fetchNearby(lat, lng, activeFilter === "all" ? undefined : activeFilter);
        setLocating(false);
      },
      () => { setLocating(false); setError("Could not get location. Allow location access."); }
    );
  };

  // ── Render markers ────────────────────────────────────────
  const renderMarkers = useCallback((spotList: Spot[]) => {
    if (!leafletMap.current) return;
    const L = (window as any).L;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    spotList.forEach(spot => {
      if (!spot.lat || !spot.lng) return;
      const color = TYPE_COLOR[spot.type] || "#C56A3D";
      const emoji = TYPE_EMOJI[spot.type] || "📍";
      const html  = `
        <div class="map-marker-wrap">
          <div class="map-marker" style="background:${color}">
            <span style="font-size:1rem">${emoji}</span>
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

  const toSpots = (data: any[]): Spot[] =>
    data.map(e => ({
      id: e.establishmentId, name: e.name,
      type: (e.estabType||"cafe") as "cafe"|"restaurant"|"bar",
      rating: e.averageRating||0, reviewCount: e.reviewCount||0,
      distance: e.distanceKm ? `${e.distanceKm.toFixed(1)} km` : "",
      isOpen: e.isOpen !== false,
      lat: e.latitude, lng: e.longitude,
      address: e.address||"", description: e.description||"", phone: e.phone||"",
    }));

  const topRated = spots.length > 0
    ? [...spots].sort((a,b) => b.rating - a.rating)[0]
    : null;

  // ── Nav helper ─────────────────────────────────────────────
  const handleNav = (id: NavItem) => {
    setActiveNav(id);
    if (id === "profile")  { setShowProfile(true);  setShowFavorites(false); }
    if (id === "saved")    { setShowFavorites(true); setShowProfile(false);  }
    if (id === "food")     { setShowProfile(false);  setShowFavorites(false); }
  };

  // ── Overlay close helper ───────────────────────────────────
  const closeOverlay = () => {
    setShowProfile(false);
    setShowFavorites(false);
    setActiveNav("food");
    // invalidateSize is handled by the useEffect watching showProfile/showFavorites
  };

  return (
    <>
      <style>{styles}</style>

      {/* ── Main app — always mounted so the map is never destroyed ── */}
      <div className="home-container">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">AK</div>
            <span className="brand-name">AratKain</span>
          </div>
          <nav className="sidebar-nav">
            {([
              { id:"food"    as NavItem, icon:<Icon.Food/>    },
              { id:"saved"   as NavItem, icon:<Icon.Bookmark/>},
              { id:"profile" as NavItem, icon:<Icon.User/>    },
            ] as const).map(({id,icon}) => (
              <button key={id}
                className={`nav-btn ${activeNav===id?"active":""}`}
                onClick={() => handleNav(id)}
                title={id.charAt(0).toUpperCase()+id.slice(1)}
              >{icon}</button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <button className="logout-btn" onClick={handleLogout} disabled={loggingOut} title="Log out">
              <Icon.Logout/>
              <span>{loggingOut?"...":"Out"}</span>
            </button>
          </div>
        </aside>

        {/* ── Results Panel ── */}
        <div className="results-panel">
          <div className="results-header">
            <div className="results-title">
              {activeFilter === "all" ? "Discover Places" :
               activeFilter === "cafe" ? "☕ Cafes" :
               activeFilter === "restaurant" ? "🍽️ Restaurants" : "🍸 Bars"}
            </div>
            <div className="results-subtitle">
              {spots.length} place{spots.length !== 1 ? "s" : ""} found
              {userLat ? " · sorted by distance" : " · sorted by rating"}
            </div>
          </div>
          <div className="results-list">
            {loading ? (
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
            ) : spots.map(spot => (
              <div key={spot.id}
                className={`result-card ${selectedSpot?.id===spot.id?"selected":""}`}
                onClick={() => { setSelectedSpot(spot); leafletMap.current?.panTo([spot.lat,spot.lng]); }}
              >
                <div className="result-card-top">
                  <div className="result-type-badge" style={{background:`${TYPE_COLOR[spot.type]}20`}}>
                    <span>{TYPE_EMOJI[spot.type]}</span>
                  </div>
                  <div className="result-info">
                    <div className="result-name">{spot.name}</div>
                    <div className="result-type-label">{spot.type}</div>
                  </div>
                  <span className={`result-open-badge ${spot.isOpen?"open":"closed"}`}>
                    {spot.isOpen?"Open":"Closed"}
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

          {loading && (
            <div className="loading-overlay">
              <div className="spinner"/> <span>Finding places...</span>
            </div>
          )}

          {error && (
            <div className="error-toast" onClick={() => setError("")}>
              ⚠ {error} &nbsp;✕
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
            <button className="locate-btn" onClick={handleLocate} disabled={locating}>
              <Icon.Locate/> {locating ? "Locating…" : "Near Me"}
            </button>
          </div>

          {/* Filter pills */}
          <div className="filter-pills">
            {FILTERS.map(f => (
              <button key={f.id}
                className={`pill ${activeFilter===f.id?"active":"inactive"}`}
                onClick={() => handleFilter(f.id)}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>

          {/* Top rated widget */}
          {topRated && !selectedSpot && (
            <div className="top-rated-widget"
              style={{cursor:"pointer"}}
              onClick={() => { setSelectedSpot(topRated); leafletMap.current?.panTo([topRated.lat,topRated.lng]); }}
            >
              <div className="top-rated-label">⭐ Top Rated Nearby</div>
              <div className="top-rated-item">
                <span className="top-rated-emoji">{TYPE_EMOJI[topRated.type]}</span>
                <div className="top-rated-info">
                  <div className="top-rated-name">{topRated.name}</div>
                  <div className="top-rated-score">
                    <Icon.Star/> {topRated.rating.toFixed(1)} · {topRated.type}
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
                <span style={{fontSize:"3rem"}}>{TYPE_EMOJI[selectedSpot.type]}</span>
              </div>
              <div className="info-card-body">
                <div className="info-card-top">
                  <div className="info-card-name">{selectedSpot.name}</div>
                  <span className={`info-card-open ${selectedSpot.isOpen?"open":"closed"}`}>
                    {selectedSpot.isOpen?"Open":"Closed"}
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
                  <span className="info-card-type-label">{selectedSpot.type}</span>
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
                  <button className="card-btn primary"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedSpot.lat},${selectedSpot.lng}`,"_blank")}>
                    <Icon.Navigate/> Directions
                  </button>
                  <button
                    className={`card-btn ${favorites.has(selectedSpot.id) ? "saved" : "secondary"}`}
                    onClick={() => toggleFavorite(selectedSpot)}
                  >
                    {favorites.has(selectedSpot.id)
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
      {showProfile && (
        <div className="page-overlay">
          <ProfilePage
            user={user}
            onBack={closeOverlay}
            onUpdated={onUserUpdate}
          />
        </div>
      )}

      {/* ── Favorites overlay — map stays alive underneath ── */}
      {showFavorites && (
        <div className="page-overlay">
          <FavoritesPage
            user={user}
            favorites={favorites}
            onBack={closeOverlay}
            onViewOnMap={(spot) => {
              closeOverlay();
              setSelectedSpot(spot);
              // invalidateSize fires via useEffect, then pan
              setTimeout(() => leafletMap.current?.panTo([spot.lat, spot.lng]), 120);
            }}
            onToggleFavorite={toggleFavorite}
            onLogout={onLogout}
            onProfile={() => { setShowFavorites(false); setShowProfile(true); setActiveNav("profile"); }}
          />
        </div>
      )}
    </>
  );
}