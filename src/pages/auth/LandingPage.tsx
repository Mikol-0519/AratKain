import React from 'react';

interface LandingPageProps {
  onLogin:    () => void;
  onRegister: () => void;
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream:    #F7F2EA;
    --espresso: #2C1A0E;
    --latte:    #C8A97E;
    --steam:    #E8DDD0;
    --accent:   #B85C38;
    --muted:    #8A7060;
    --dark:     #1A0F07;
  }

  html, body, #root { height: 100%; }

  .landing {
    min-height: 100vh;
    background: var(--espresso);
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    position: relative;
  }

  /* ── Animated grain overlay ── */
  .landing::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
    pointer-events: none;
    z-index: 1;
    opacity: 0.4;
  }

  /* ── Navbar ── */
  .nav {
    position: fixed;
    top: 0; left: 0; right: 0;
    z-index: 100;
    padding: 1.25rem 3rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(to bottom, rgba(44,26,14,0.95), transparent);
  }

  .nav-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1.5rem;
    font-weight: 900;
    color: var(--cream);
    letter-spacing: -0.02em;
  }

  .nav-logo span { color: var(--latte); }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .btn-ghost {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    border: 1px solid rgba(200,169,126,0.3);
    background: transparent;
    color: var(--latte);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.01em;
  }

  .btn-ghost:hover {
    background: rgba(200,169,126,0.1);
    border-color: rgba(200,169,126,0.6);
    color: var(--cream);
  }

  .btn-fill {
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    border: none;
    background: var(--accent);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    letter-spacing: 0.01em;
  }

  .btn-fill:hover {
    background: #cc6b42;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(184,92,56,0.4);
  }

  /* ── Hero ── */
  .hero {
    min-height: 100vh;
    display: flex;
    align-items: center;
    position: relative;
    padding: 0 3rem;
    overflow: hidden;
  }

  /* Radial glow behind text */
  .hero::after {
    content: '';
    position: absolute;
    top: 50%; left: 30%;
    transform: translate(-50%, -50%);
    width: 700px; height: 700px;
    background: radial-gradient(circle, rgba(184,92,56,0.12) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 2;
    max-width: 620px;
    animation: heroFadeIn 0.9s ease both;
  }

  @keyframes heroFadeIn {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .hero-tag {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(200,169,126,0.1);
    border: 1px solid rgba(200,169,126,0.2);
    border-radius: 100px;
    padding: 6px 16px;
    margin-bottom: 1.75rem;
    animation: heroFadeIn 0.9s 0.1s ease both;
  }

  .hero-tag-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--accent);
    animation: pulse 2s ease infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.85); }
  }

  .hero-tag span {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--latte);
  }

  .hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(3rem, 6vw, 5rem);
    font-weight: 900;
    line-height: 1.05;
    color: var(--cream);
    margin-bottom: 1.5rem;
    animation: heroFadeIn 0.9s 0.2s ease both;
  }

  .hero-title em {
    font-style: italic;
    color: var(--latte);
  }

  .hero-title .accent-line {
    color: var(--accent);
    display: block;
  }

  .hero-sub {
    font-size: 1.05rem;
    color: rgba(200,169,126,0.75);
    line-height: 1.7;
    max-width: 480px;
    margin-bottom: 2.5rem;
    font-weight: 300;
    animation: heroFadeIn 0.9s 0.3s ease both;
  }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    animation: heroFadeIn 0.9s 0.4s ease both;
  }

  .btn-hero-primary {
    padding: 0.875rem 2rem;
    border-radius: 10px;
    border: none;
    background: var(--accent);
    color: white;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 20px rgba(184,92,56,0.35);
  }

  .btn-hero-primary:hover {
    background: #cc6b42;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(184,92,56,0.45);
  }

  .btn-hero-primary svg { width: 18px; height: 18px; }

  .btn-hero-secondary {
    padding: 0.875rem 2rem;
    border-radius: 10px;
    border: 1.5px solid rgba(200,169,126,0.35);
    background: transparent;
    color: var(--latte);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .btn-hero-secondary:hover {
    background: rgba(200,169,126,0.08);
    border-color: rgba(200,169,126,0.6);
    color: var(--cream);
  }

  /* ── Hero map mockup ── */
  .hero-visual {
    position: absolute;
    right: -40px; top: 50%;
    transform: translateY(-50%);
    width: 520px; height: 520px;
    animation: heroFadeIn 0.9s 0.5s ease both;
  }

  .map-mockup {
    width: 100%; height: 100%;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(200,169,126,0.1);
    border-radius: 24px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(4px);
  }

  .map-mockup-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(200,169,126,0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(200,169,126,0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .map-road {
    position: absolute;
    background: rgba(200,169,126,0.08);
    border-radius: 2px;
  }

  .map-road.h { height: 8px; left: 0; right: 0; }
  .map-road.v { width: 8px; top: 0; bottom: 0; }

  .map-pin {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    animation: pinDrop 0.5s ease both;
  }

  @keyframes pinDrop {
    from { opacity: 0; transform: translateY(-20px) scale(0.5); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .map-pin-icon {
    width: 28px; height: 28px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 2px solid white;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    transition: transform 0.2s;
  }

  .map-pin:hover .map-pin-icon {
    transform: rotate(-45deg) scale(1.2);
  }

  .map-pin-icon.cafe       { background: var(--accent); }
  .map-pin-icon.restaurant { background: var(--espresso); border-color: var(--latte); }
  .map-pin-icon.bar        { background: var(--latte); }

  .map-pin-label {
    margin-top: 6px;
    background: rgba(44,26,14,0.9);
    color: var(--cream);
    font-size: 0.6rem;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 100px;
    white-space: nowrap;
    letter-spacing: 0.04em;
    opacity: 0;
    transform: translateY(4px);
    transition: all 0.2s;
  }

  .map-pin:hover .map-pin-label {
    opacity: 1;
    transform: translateY(0);
  }

  .map-user-pin {
    position: absolute;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #4A90E2;
    border: 3px solid white;
    box-shadow: 0 0 0 6px rgba(74,144,226,0.2), 0 4px 12px rgba(0,0,0,0.3);
    animation: userPulse 2s ease infinite;
  }

  @keyframes userPulse {
    0%, 100% { box-shadow: 0 0 0 6px rgba(74,144,226,0.2), 0 4px 12px rgba(0,0,0,0.3); }
    50%       { box-shadow: 0 0 0 12px rgba(74,144,226,0.1), 0 4px 12px rgba(0,0,0,0.3); }
  }

  .map-card {
    position: absolute;
    background: white;
    border-radius: 12px;
    padding: 10px 14px;
    min-width: 140px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.25);
    animation: cardFloat 3s ease-in-out infinite;
  }

  @keyframes cardFloat {
    0%, 100% { transform: translateY(0); }
    50%       { transform: translateY(-6px); }
  }

  .map-card-name {
    font-family: 'Playfair Display', serif;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--espresso);
    margin-bottom: 4px;
  }

  .map-card-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.6rem;
    color: var(--muted);
  }

  .map-card-rating {
    color: #F5A623;
    font-weight: 600;
  }

  .map-card-badge {
    background: #EDFAF3;
    color: #2C7A4B;
    padding: 1px 6px;
    border-radius: 4px;
    font-weight: 600;
    font-size: 0.55rem;
  }

  /* ── Stats strip ── */
  .stats-strip {
    position: relative;
    z-index: 2;
    border-top: 1px solid rgba(200,169,126,0.1);
    border-bottom: 1px solid rgba(200,169,126,0.1);
    padding: 2rem 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4rem;
    background: rgba(255,255,255,0.02);
  }

  .stat-item {
    text-align: center;
    animation: heroFadeIn 0.9s 0.6s ease both;
  }

  .stat-num {
    font-family: 'Playfair Display', serif;
    font-size: 2.25rem;
    font-weight: 900;
    color: var(--latte);
    line-height: 1;
    margin-bottom: 4px;
  }

  .stat-label {
    font-size: 0.72rem;
    color: rgba(200,169,126,0.5);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  .stat-divider {
    width: 1px;
    height: 40px;
    background: rgba(200,169,126,0.15);
  }

  /* ── Features ── */
  .features {
    position: relative;
    z-index: 2;
    padding: 5rem 3rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  .section-label {
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
  }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 700;
    color: var(--cream);
    line-height: 1.2;
    margin-bottom: 3rem;
  }

  .section-title em {
    font-style: italic;
    color: var(--latte);
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }

  .feature-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(200,169,126,0.1);
    border-radius: 16px;
    padding: 1.75rem;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .feature-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    opacity: 0;
    transition: opacity 0.3s;
  }

  .feature-card:hover {
    background: rgba(255,255,255,0.055);
    border-color: rgba(200,169,126,0.2);
    transform: translateY(-4px);
  }

  .feature-card:hover::before { opacity: 1; }

  .feature-icon {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: rgba(184,92,56,0.15);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 1.25rem;
    font-size: 1.25rem;
  }

  .feature-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--cream);
    margin-bottom: 0.5rem;
  }

  .feature-desc {
    font-size: 0.82rem;
    color: rgba(200,169,126,0.6);
    line-height: 1.6;
  }

  /* ── CTA ── */
  .cta {
    position: relative;
    z-index: 2;
    padding: 5rem 3rem;
    text-align: center;
    border-top: 1px solid rgba(200,169,126,0.1);
  }

  .cta-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 900;
    color: var(--cream);
    margin-bottom: 1rem;
    line-height: 1.1;
  }

  .cta-title em { font-style: italic; color: var(--latte); }

  .cta-sub {
    font-size: 0.95rem;
    color: rgba(200,169,126,0.6);
    margin-bottom: 2.5rem;
    font-weight: 300;
  }

  .cta-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .btn-cta {
    padding: 1rem 2.5rem;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s ease;
  }

  .btn-cta.primary {
    background: var(--accent);
    color: white;
    border: none;
    box-shadow: 0 4px 20px rgba(184,92,56,0.35);
  }

  .btn-cta.primary:hover {
    background: #cc6b42;
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(184,92,56,0.45);
  }

  .btn-cta.secondary {
    background: transparent;
    color: var(--latte);
    border: 1.5px solid rgba(200,169,126,0.35);
  }

  .btn-cta.secondary:hover {
    background: rgba(200,169,126,0.08);
    border-color: rgba(200,169,126,0.6);
    color: var(--cream);
  }

  /* ── Footer ── */
  .footer {
    position: relative;
    z-index: 2;
    padding: 1.5rem 3rem;
    border-top: 1px solid rgba(200,169,126,0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .footer-logo {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 700;
    color: rgba(200,169,126,0.4);
  }

  .footer-logo span { color: rgba(184,92,56,0.5); }

  .footer-copy {
    font-size: 0.72rem;
    color: rgba(200,169,126,0.25);
    letter-spacing: 0.04em;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .hero-visual { display: none; }
    .features-grid { grid-template-columns: 1fr; }
    .stats-strip { gap: 2rem; flex-wrap: wrap; }
    .nav { padding: 1rem 1.5rem; }
    .hero { padding: 0 1.5rem; padding-top: 5rem; }
    .features { padding: 3rem 1.5rem; }
    .cta { padding: 3rem 1.5rem; }
  }
`;

const PINS = [
  { type: 'cafe',       top: '28%', left: '22%', label: 'Burnham Brew',        delay: '0.6s' },
  { type: 'restaurant', top: '45%', left: '55%', label: 'Padre Faura Kitchen', delay: '0.8s' },
  { type: 'cafe',       top: '62%', left: '30%', label: 'Rizal Roast',         delay: '1.0s' },
  { type: 'bar',        top: '35%', left: '72%', label: 'Sampaguita Bar',      delay: '1.2s' },
  { type: 'restaurant', top: '70%', left: '65%', label: 'El Nido Bistro',      delay: '1.4s' },
];

const ROADS_H = ['20%', '48%', '74%'];
const ROADS_V = ['35%', '60%', '82%'];

const FEATURES = [
  { title: 'Find Nearby Places',    desc: 'Instantly discover cafes and restaurants within your area using real-time GPS location.' },
  { title: 'Reviews & Ratings',      desc: 'Read honest reviews from real users and share your own experience to help others.' },
  { title: 'Save Favorites',         desc: 'Bookmark your favorite spots for quick access anytime, anywhere.' },
  { title: 'Interactive Map',        desc: 'Explore your neighborhood visually with an interactive pin map showing all nearby spots.' },
  { title: 'Search & Filter',        desc: 'Filter by cafes, restaurants, or bars and search by name to find exactly what you want.' },
  { title: 'Opening Hours',          desc: 'See live opening hours so you never show up to a closed door again.' },
];

export default function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  return (
    <>
      <style>{styles}</style>
      <div className="landing">

        {/* ── Navbar ── */}
        <nav className="nav">
          <div className="nav-logo">Arat<span>Kain</span></div>
          <div className="nav-links">
            <button className="btn-ghost" onClick={onLogin}>Log In</button>
            <button className="btn-fill"  onClick={onRegister}>Get Started</button>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              <span>Cebu's Cafe & Restaurant Tracker</span>
            </div>

            <h1 className="hero-title">
              Discover your next<br />
              <em>favorite</em> spot
              <span className="accent-line">near you.</span>
            </h1>

            <p className="hero-sub">
              AratKain helps you find the best cafes, restaurants, and bars
              around you — with real reviews, live hours, and an interactive map.
            </p>

            <div className="hero-actions">
              <button className="btn-hero-primary" onClick={onRegister}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Start Exploring
              </button>
              <button className="btn-hero-secondary" onClick={onLogin}>
                Already a member? Log in
              </button>
            </div>
          </div>

          {/* Map visual */}
          <div className="hero-visual">
            <div className="map-mockup">
              <div className="map-mockup-grid" />

              {/* Roads */}
              {ROADS_H.map((top, i) => (
                <div key={i} className="map-road h" style={{ top }} />
              ))}
              {ROADS_V.map((left, i) => (
                <div key={i} className="map-road v" style={{ left }} />
              ))}

              {/* User location */}
              <div className="map-user-pin" style={{ top: '50%', left: '45%' }} />

              {/* Place pins */}
              {PINS.map((pin, i) => (
                <div key={i} className="map-pin" style={{ top: pin.top, left: pin.left, animationDelay: pin.delay }}>
                  <div className={`map-pin-icon ${pin.type}`} />
                  <div className="map-pin-label">{pin.label}</div>
                </div>
              ))}

              {/* Floating card */}
              <div className="map-card" style={{ bottom: '14%', left: '8%' }}>
                <div className="map-card-name">Burnham Brew ☕</div>
                <div className="map-card-meta">
                  <span className="map-card-rating">★ 4.8</span>
                  <span>·</span>
                  <span>200m away</span>
                  <span className="map-card-badge">Open</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <div className="stats-strip">
          {[
            { num: '200+', label: 'Places Listed' },
            { num: '4.8★', label: 'Avg. Rating'   },
            { num: '50+',  label: 'Cafes & Bars'  },
            { num: '100%', label: 'Free to Use'   },
          ].map((s, i) => (
            <>
              {i > 0 && <div key={`d${i}`} className="stat-divider" />}
              <div key={i} className="stat-item">
                <div className="stat-num">{s.num}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </>
          ))}
        </div>

        {/* ── Features ── */}
        <section className="features">
          <div className="section-label">Why AratKain</div>
          <div className="section-title">
            Everything you need to<br /><em>explore your city</em>
          </div>
          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feature-card">
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta">
          <h2 className="cta-title">
            Ready to find your<br /><em>next great meal?</em>
          </h2>
          <p className="cta-sub">Join AratKain and start discovering today. It's completely free.</p>
          <div className="cta-actions">
            <button className="btn-cta primary"   onClick={onRegister}>Create Free Account</button>
            <button className="btn-cta secondary" onClick={onLogin}>Log In</button>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="footer-logo">Arat<span>Kain</span></div>
          <div className="footer-copy">© 2025 AratKain · Discover · Explore · Savor</div>
        </footer>

      </div>
    </>
  );
}