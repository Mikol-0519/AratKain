import {
  StrengthLevel,
  STRENGTH_LABELS,
  STRENGTH_CLASSES,
  STRENGTH_COLORS,
} from "../../types/auth";

interface StrengthMeterProps {
  score: StrengthLevel;
}

export default function StrengthMeter({ score }: StrengthMeterProps) {
  if (!score) return null;
  return (
    <>
      <div className="password-strength">
        {([1, 2, 3, 4] as StrengthLevel[]).map((i) => (
          <div
            key={i}
            className={`strength-bar ${score >= i ? STRENGTH_CLASSES[i] : ""}`}
          />
        ))}
      </div>
      <span className="error-msg" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </span>
    </>
  );
}