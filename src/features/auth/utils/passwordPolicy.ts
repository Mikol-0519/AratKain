/**
 * Single source of truth for password rules and strength.
 *
 * Previously these rules were duplicated across `utils/auth.ts`,
 * `utils/PasswordStrength.ts`, `authService.ts`, `ResetPasswordPage.tsx` and
 * `ProfilePage.tsx` — with two different strength scales that had drifted
 * apart (`STRENGTH_CLASSES` vs `STRENGTH_BAR_CLASSES`, and a different
 * "strong" colour in each file). Every rule change meant editing five files
 * and hoping nobody missed one.
 *
 * Rule of thumb: if a password rule is enforced anywhere, it is defined here.
 */

/** Minimum accepted password length, enforced by every entry point. */
export const PASSWORD_MIN_LENGTH = 6;

/** Length at which the password starts counting towards "strong". */
export const PASSWORD_STRONG_LENGTH = 8;

/**
 * 0 = empty, 1..4 = weak..strong.
 * Each point is earned by one independent property, so the score is 0..4.
 */
export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

export const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: '',
  1: 'Weak',
  2: 'Fair',
  3: 'Good',
  4: 'Strong',
};

/** Colour of the strength label. Matches `--espresso` in styles/auth.css. */
export const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: 'transparent',
  1: '#e74c3c',
  2: '#f39c12',
  3: '#2ecc71',
  4: '#2C1A0E',
};

/** CSS class of a filled strength bar (styles/auth.css `.strength-bar.*`). */
export const STRENGTH_BAR_CLASSES: Record<StrengthLevel, string> = {
  0: '',
  1: 'active-weak',
  2: 'active-fair',
  3: 'active-good',
  4: 'active-strong',
};

/** Score a password from 0 (empty) to 4 (strong). */
export function getPasswordStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= PASSWORD_STRONG_LENGTH) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score as StrengthLevel;
}

/**
 * Validate a password length.
 * @returns an error message, or `null` when the password is acceptable.
 */
export function validatePassword(password: string): string | null {
  if (!password) return 'Password is required';
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

/**
 * Validate that the confirmation matches the password.
 * @returns an error message, or `null` when they match.
 */
export function validatePasswordConfirmation(
  password: string,
  confirmation: string,
): string | null {
  if (password !== confirmation) return 'Passwords do not match';
  return null;
}
