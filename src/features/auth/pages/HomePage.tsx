import ProfilePage from './ProfilePage';
import { useEffect, useRef, useState } from "react";
import { supabase } from "../services/supabaseClient";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500&display=swap');
  @import url('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream: #F7F2EA;
    --espresso: #2C1A0E;
    --latte: #C8A97E;
    --steam: #E8DDD0;
    --accent: #B85C38;
    --muted: #8A7060;
    --sidebar-w: 64px;
  }

  html, body, #root {
    height: 100%;
    font-family: 'DM Sans', sans-serif;
  }

  .home-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
  }

  .sidebar {
    width: var(--sidebar-w);
    height: 100%;
    background: var(--espresso);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1rem 0;
    z-index: 1000;
    position: relative;
    box-shadow: 4px 0 20px rgba(44,26,14,0.3);
    flex-shrink: 0;
  }

  .sidebar-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 900;
    color: var(--latte);
    text-align: center;
    line-height: 1;
    padding-bottom: 1.25rem;
    border-bottom: 1px solid rgba(200,169,126,0.15);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .sidebar-logo .logo-ak {
    font-size: 1.1rem;
    color: var(--cream);
  }

  .sidebar-logo .logo-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    display: block;
  }

  .sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding-top: 1rem;
  }

  .nav-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: none;
    background: transparent;
    color: rgba(200,169,126,0.5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    position: relative;
  }

  .nav-btn:hover {
    background: rgba(200,169,126,0.1);
    color: var(--latte);
  }

  .nav-btn.active {
    background: rgba(184,92,56,0.2);
    color: var(--accent);
  }

  .nav-btn.active::before {
    content: '';
    position: absolute;
    left: -1px;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    border-radius: 0 2px 2px 0;
    background: var(--accent);
  }

  .nav-btn svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.8;
  }

  .sidebar-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .get-app-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(200,169,126,0.2);
    background: transparent;
    color: rgba(200,169,126,0.5);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    transition: all 0.2s ease;
  }

  .get-app-btn:hover {
    background: rgba(200,169,126,0.1);
    color: var(--latte);
    border-color: rgba(200,169,126,0.4);
  }

  .get-app-btn svg { width: 18px; height: 18px; stroke-width: 1.8; }

  .get-app-btn span {
    font-size: 0.45rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: inherit;
    font-weight: 500;
    line-height: 1;
  }

  /* ── Logout Button ── */
  .logout-btn {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    border: 1px solid rgba(184,92,56,0.25);
    background: transparent;
    color: rgba(184,92,56,0.55);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: rgba(184,92,56,0.15);
    color: var(--accent);
    border-color: rgba(184,92,56,0.5);
  }

  .logout-btn:active {
    transform: scale(0.95);
  }

  .logout-btn svg { width: 18px; height: 18px; stroke-width: 1.8; }

  .logout-btn span {
    font-size: 0.42rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: inherit;
    font-weight: 500;
    line-height: 1;
  }

  /* ── Map Area ── */
  .map-area {
    flex: 1;
    position: relative;
    overflow: hidden;
  }

  #map {
    width: 100%;
    height: 100%;
  }

  .search-bar {
    position: absolute;
    top: 16px;
    left: 16px;
    right: 16px;
    z-index: 900;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .search-input-wrap {
    flex: 1;
    max-width: 400px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 24px rgba(44,26,14,0.15);
    display: flex;
    align-items: center;
    padding: 0 14px;
    gap: 10px;
    border: 1.5px solid transparent;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .search-input-wrap:focus-within {
    border-color: var(--latte);
    box-shadow: 0 4px 24px rgba(44,26,14,0.15), 0 0 0 3px rgba(200,169,126,0.12);
  }

  .search-input-wrap svg {
    width: 16px;
    height: 16px;
    color: var(--muted);
    flex-shrink: 0;
    stroke-width: 2;
  }

  .search-input {
    flex: 1;
    border: none;
    outline: none;
    padding: 12px 0;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    color: var(--espresso);
    background: transparent;
  }

  .search-input::placeholder { color: #B8A99A; }

  .search-kbd {
    font-size: 0.65rem;
    color: var(--muted);
    background: var(--steam);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'DM Sans', sans-serif;
    letter-spacing: 0.05em;
    flex-shrink: 0;
  }

  .filter-pills {
    position: absolute;
    top: 68px;
    left: 16px;
    z-index: 900;
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .pill {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 20px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(44,26,14,0.1);
    white-space: nowrap;
  }

  .pill.inactive {
    background: white;
    color: var(--muted);
  }

  .pill.inactive:hover {
    background: var(--steam);
    color: var(--espresso);
  }

  .pill.active {
    background: var(--espresso);
    color: var(--cream);
  }

  .pill svg { width: 12px; height: 12px; stroke-width: 2; }

  .info-card {
    position: absolute;
    bottom: 24px;
    left: 16px;
    z-index: 900;
    background: white;
    border-radius: 16px;
    padding: 16px 18px;
    width: 280px;
    box-shadow: 0 8px 32px rgba(44,26,14,0.18);
    border: 1px solid var(--steam);
    animation: slideUp 0.3s ease both;
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .info-card-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .info-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--espresso);
    line-height: 1.2;
  }

  .info-card-type {
    font-size: 0.7rem;
    color: var(--muted);
    margin-top: 2px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .info-card-badge {
    background: var(--accent);
    color: white;
    font-size: 0.7rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .info-card-meta {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .meta-item svg { width: 12px; height: 12px; stroke-width: 2; }

  .info-card-actions {
    display: flex;
    gap: 8px;
  }

  .card-btn {
    flex: 1;
    padding: 8px;
    border-radius: 8px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .card-btn.primary {
    background: var(--espresso);
    color: var(--cream);
  }

  .card-btn.primary:hover { background: #3d2510; }

  .card-btn.secondary {
    background: var(--steam);
    color: var(--espresso);
  }

  .card-btn.secondary:hover { background: var(--latte); color: white; }

  .close-card {
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--muted);
    padding: 4px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
  }

  .close-card:hover { background: var(--steam); }
  .close-card svg { width: 14px; height: 14px; stroke-width: 2; }

  .nearby-chip {
    position: absolute;
    bottom: 24px;
    right: 16px;
    z-index: 900;
    background: var(--espresso);
    color: var(--cream);
    border-radius: 12px;
    padding: 10px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 4px 20px rgba(44,26,14,0.25);
    font-size: 0.78rem;
  }

  .nearby-chip-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--accent);
    animation: glow 1.5s ease-in-out infinite alternate;
    flex-shrink: 0;
  }

  @keyframes glow {
    from { box-shadow: 0 0 3px var(--accent); }
    to   { box-shadow: 0 0 10px var(--accent); }
  }

  .nearby-chip-count {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--latte);
  }

  .custom-marker {
    width: 32px;
    height: 32px;
    background: var(--accent);
    border: 2px solid white;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 3px 10px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: transform 0.2s;
  }

  .custom-marker:hover { transform: rotate(-45deg) scale(1.15); }
  .custom-marker.cafe { background: #B85C38; }
  .custom-marker.restaurant { background: #2C1A0E; }
  .custom-marker.bar { background: #C8A97E; }

  .marker-tooltip {
    background: var(--espresso) !important;
    color: var(--cream) !important;
    border: none !important;
    border-radius: 8px !important;
    font-family: 'DM Sans', sans-serif !important;
    font-size: 0.75rem !important;
    padding: 5px 10px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
  }

  .marker-tooltip::before { display: none !important; }

  .leaflet-control-zoom {
    border: none !important;
    border-radius: 12px !important;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(44,26,14,0.15) !important;
  }

  .leaflet-control-zoom a {
    background: white !important;
    color: var(--espresso) !important;
    border: none !important;
    font-size: 16px !important;
    line-height: 30px !important;
    width: 32px !important;
    height: 32px !important;
  }

  .leaflet-control-zoom a:hover { background: var(--steam) !important; }
  .leaflet-control-attribution { display: none !important; }
`;

type NavItem = "food" | "saved" | "profile";
type FilterType = "all" | "cafe" | "restaurant" | "bar";

interface Spot {
  id: number;
  name: string;
  type: "cafe" | "restaurant" | "bar";
  rating: number;
  distance: string;
  status: "Open" | "Closed";
  lat: number;
  lng: number;
}

interface HomePageProps {
  onLogout:   () => void;
  user:       { id: string; email: string; username: string; fullname: string; };
  onUserUpdate: (u: { id: string; email: string; username: string; fullname: string; }) => void;
}

const SPOTS: Spot[] = [
  { id: 1, name: "Café Intramuros",    type: "cafe",       rating: 4.7, distance: "120m", status: "Open",   lat: 14.5895, lng: 120.9747 },
  { id: 2, name: "Padre Faura Kitchen",type: "restaurant", rating: 4.5, distance: "340m", status: "Open",   lat: 14.5840, lng: 120.9800 },
  { id: 3, name: "El Nido Bistro",     type: "restaurant", rating: 4.3, distance: "560m", status: "Open",   lat: 14.5920, lng: 120.9710 },
  { id: 4, name: "Burnham Brew",       type: "cafe",       rating: 4.8, distance: "200m", status: "Open",   lat: 14.5870, lng: 120.9770 },
  { id: 5, name: "Sampaguita Bar",     type: "bar",        rating: 4.2, distance: "780m", status: "Closed", lat: 14.5810, lng: 120.9830 },
  { id: 6, name: "Rizal Roast",        type: "cafe",       rating: 4.6, distance: "430m", status: "Open",   lat: 14.5950, lng: 120.9680 },
];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all",        label: "All"         },
  { id: "cafe",       label: "Cafes"       },
  { id: "restaurant", label: "Restaurants" },
  { id: "bar",        label: "Bars"        },
];

const Icon = {
  Food: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><line x1="7" y1="2" x2="7" y2="22" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
    </svg>
  ),
  Bookmark: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  ),
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Phone: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  Logout: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Navigate: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  ),
};

export default function HomePage({ onLogout, user, onUserUpdate }: HomePageProps) {
  const mapRef      = useRef<HTMLDivElement>(null);
  const leafletMap  = useRef<any>(null);
  const markersRef  = useRef<any[]>([]);

  const [activeNav,    setActiveNav]    = useState<NavItem>("food");
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null);
  const [search,       setSearch]       = useState("");
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [loggingOut,   setLoggingOut]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);

  // ── Logout handler ────────────────────────────────────────
  const handleLogout = async () => {
    setLoggingOut(true);
    await supabase.auth.signOut();
    onLogout();
  };

  // Load Leaflet dynamically
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

  // Init map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || leafletMap.current) return;
    const L = (window as any).L;

    leafletMap.current = L.map(mapRef.current, {
      center: [14.5895, 120.9747],
      zoom: 15,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(leafletMap.current);
  }, [leafletLoaded]);

  // Update markers
  useEffect(() => {
    if (!leafletLoaded || !leafletMap.current) return;
    const L = (window as any).L;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const filtered = SPOTS.filter(
      (s) => activeFilter === "all" || s.type === activeFilter
    );

    filtered.forEach((spot) => {
      const el = document.createElement("div");
      el.className = `custom-marker ${spot.type}`;

      const icon = L.divIcon({
        html: el.outerHTML,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([spot.lat, spot.lng], { icon })
        .addTo(leafletMap.current)
        .bindTooltip(spot.name, {
          className: "marker-tooltip",
          direction: "top",
          offset: [0, -28],
        });

      marker.on("click", () => setSelectedSpot(spot));
      markersRef.current.push(marker);
    });
  }, [leafletLoaded, activeFilter]);

  const filteredCount =
    activeFilter === "all"
      ? SPOTS.length
      : SPOTS.filter((s) => s.type === activeFilter).length;

  // Show profile page
  if (showProfile) {
    return (
      <ProfilePage
        user={user}
        onBack={() => { setShowProfile(false); setActiveNav('food'); }}
        onUpdated={(updated) => { onUserUpdate(updated); }}
      />
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="home-container">

        {/* ── Sidebar ── */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <span className="logo-ak">AK</span>
            <span className="logo-dot" />
          </div>

          <nav className="sidebar-nav">
            {(
              [
                { id: "food"    as NavItem, icon: <Icon.Food /> },
                { id: "saved"   as NavItem, icon: <Icon.Bookmark /> },
                { id: "profile" as NavItem, icon: <Icon.User /> },
              ] as const
            ).map(({ id, icon }) => (
              <button
                key={id}
                className={`nav-btn ${activeNav === id ? "active" : ""}`}
                onClick={() => { setActiveNav(id); if (id === "profile") setShowProfile(true); }}
                title={id.charAt(0).toUpperCase() + id.slice(1)}
              >
                {icon}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <button className="get-app-btn" title="Get App">
              <Icon.Phone />
              <span>App</span>
            </button>

            {/* ── Logout Button ── */}
            <button
              className="logout-btn"
              title="Log out"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              <Icon.Logout />
              <span>{loggingOut ? "..." : "Out"}</span>
            </button>
          </div>
        </aside>

        {/* ── Map Area ── */}
        <div className="map-area">
          <div id="map" ref={mapRef} />

          {/* Search */}
          <div className="search-bar">
            <div className="search-input-wrap">
              <Icon.Search />
              <input
                className="search-input"
                placeholder="Search for a place…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="search-kbd">⌘K</span>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="filter-pills">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                className={`pill ${activeFilter === f.id ? "active" : "inactive"}`}
                onClick={() => setActiveFilter(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Selected Spot Card */}
          {selectedSpot && (
            <div className="info-card">
              <button className="close-card" onClick={() => setSelectedSpot(null)}>
                <Icon.Close />
              </button>
              <div className="info-card-header">
                <div>
                  <div className="info-card-name">{selectedSpot.name}</div>
                  <div className="info-card-type">{selectedSpot.type}</div>
                </div>
                <div
                  className="info-card-badge"
                  style={{ background: selectedSpot.status === "Open" ? "#2C7A4B" : "#8A7060" }}
                >
                  {selectedSpot.status}
                </div>
              </div>
              <div className="info-card-meta">
                <div className="meta-item">
                  <Icon.Star />
                  <span style={{ color: "#C8A97E" }}>{selectedSpot.rating}</span>
                </div>
                <div className="meta-item">
                  <Icon.MapPin />
                  <span>{selectedSpot.distance} away</span>
                </div>
              </div>
              <div className="info-card-actions">
                <button className="card-btn primary">
                  <Icon.Navigate /> &nbsp;Directions
                </button>
                <button className="card-btn secondary">
                  <Icon.Bookmark /> &nbsp;Save
                </button>
              </div>
            </div>
          )}

          {/* Nearby Chip */}
          <div className="nearby-chip">
            <div className="nearby-chip-dot" />
            <span>Nearby</span>
            <span className="nearby-chip-count">{filteredCount}</span>
            <span>spots</span>
          </div>
        </div>
      </div>
    </>
  );
}