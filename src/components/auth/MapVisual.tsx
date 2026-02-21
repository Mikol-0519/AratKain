import { CSSProperties } from "react";

interface RoadProps {
  style: CSSProperties;
}

function MapRoad({ style }: RoadProps) {
  return <div className="map-road" style={style} />;
}

interface PinProps {
  variant: "accent" | "latte";
  style: CSSProperties;
}

function MapPin({ variant, style }: PinProps) {
  return <div className={`map-pin ${variant}`} style={style} />;
}

export default function MapVisual() {
  return (
    <div className="map-mockup">
      <div className="map-grid" />
      <MapRoad style={{ top: "35%", left: "10%", width: "80%", height: "2px" }} />
      <MapRoad style={{ top: "60%", left: "20%", width: "60%", height: "2px" }} />
      <MapRoad style={{ top: "15%", left: "40%", width: "2px", height: "65%" }} />
      <MapRoad style={{ top: "25%", left: "65%", width: "2px", height: "50%" }} />
      <MapPin variant="accent" style={{ top: "28%", left: "55%" }} />
      <div
        className="map-pulse"
        style={{ top: "calc(28% + 12px)", left: "calc(55% + 12px)" }}
      />
      <MapPin variant="latte" style={{ top: "50%", left: "28%" }} />
      <MapPin variant="latte" style={{ top: "20%", left: "72%" }} />
      <div className="nearby-badge">
        <div className="badge-dot" />
        <div className="badge-text">Nearby spots found</div>
        <div className="badge-count">14</div>
      </div>
    </div>
  );
}