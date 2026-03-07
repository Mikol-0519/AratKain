import MapVisual from './MapVisual';

export default function LeftPanel() {
  return (
    <div className="left-panel">
      <div className="brand">
        <div className="brand-tag">Discover · Explore · Savor</div>
        <div className="brand-name">Arat<span>Kain</span></div>
        <div className="brand-tagline">Find the best cafes &amp; restaurants near you</div>
      </div>
      <div className="visual-block">
        <MapVisual />
      </div>
      <div className="left-footer">
        <p>
          Connecting food lovers with hidden gems, local favorites,
          and new discoveries in your neighborhood — one pin at a time.
        </p>
      </div>
    </div>
  );
}