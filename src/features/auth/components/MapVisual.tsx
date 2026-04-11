import { CSSProperties } from 'react';

function Road({ style }: { style: CSSProperties }) {
  return <div className="map-road" style={style} />;
}

function Pin({ variant, style }: { variant: 'accent' | 'latte'; style: CSSProperties }) {
  return <div className={`map-pin ${variant}`} style={style} />;
}

export default function MapVisual() {
  return (
    <div className="map-mockup">
      <div className="map-grid" />
      <Road style={{ top: '35%', left: '10%', width: '80%', height: '2px' }} />
      <Road style={{ top: '60%', left: '20%', width: '60%', height: '2px' }} />
      <Road style={{ top: '15%', left: '40%', width: '2px', height: '65%' }} />
      <Road style={{ top: '25%', left: '65%', width: '2px', height: '50%' }} />
      <Pin variant="accent" style={{ top: '28%', left: '55%' }} />
      <div className="map-pulse"
           style={{ top: 'calc(28% + 11px)', left: 'calc(55% + 11px)' }} />
      <Pin variant="latte" style={{ top: '50%', left: '28%' }} />
      <Pin variant="latte" style={{ top: '20%', left: '72%' }} />
      <div className="nearby-badge">
        <div className="badge-dot" />
        <div className="badge-text">Nearby spots found</div>
        <div className="badge-count">14</div>
      </div>
    </div>
  );
}