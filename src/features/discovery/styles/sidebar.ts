/**
 * Styles for the shared sidebar.
 *
 * The sidebar markup lived in both HomePage.tsx and FavoritesPage.tsx with
 * two byte-identical copies of these rules, so any change had to be made
 * twice. Both screens now render `<Sidebar />` and inject this block.
 */
export const SIDEBAR_STYLES = `
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
    font-family: 'Playfair Display', serif;
    font-size: 0.6rem; font-weight: 700;
    color: var(--latte); letter-spacing: 0.15em;
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
    color: rgba(200,169,126,0.5); cursor: pointer;
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; gap: 3px; transition: all 0.2s ease;
  }
  .logout-btn:hover { background: rgba(197,106,61,0.12); color: var(--accent); border-color: rgba(197,106,61,0.4); }
  .logout-btn svg { width: 18px; height: 18px; stroke-width: 1.8; }
  .logout-btn span { font-size: 0.4rem; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; }
`;

export default SIDEBAR_STYLES;
