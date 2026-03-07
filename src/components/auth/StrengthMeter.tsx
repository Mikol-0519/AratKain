import {
  StrengthLevel,
  STRENGTH_LABELS,
  STRENGTH_COLORS,
  STRENGTH_BAR_CLASSES,
} from '../../utils/PasswordStrength';

interface Props { score: StrengthLevel; }

export default function StrengthMeter({ score }: Props) {
  if (!score) return null;
  return (
    <div className="strength-wrap">
      <div className="password-strength">
        {([1, 2, 3, 4] as StrengthLevel[]).map((i) => (
          <div
            key={i}
            className={`strength-bar ${score >= i ? STRENGTH_BAR_CLASSES[i] : ''}`}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: STRENGTH_COLORS[score] }}>
        {STRENGTH_LABELS[score]}
      </span>
    </div>
  );
}