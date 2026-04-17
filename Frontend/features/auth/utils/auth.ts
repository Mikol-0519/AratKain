export type AuthMode = 'login' | 'register';
export type AppPage  = 'landing' | 'login' | 'register' | 'dashboard';

export interface FormErrors {
  username?:        string;
  fullname?:        string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
}


export type StrengthLevel = 0 | 1 | 2 | 3 | 4;
export type StrengthClass =
  | "active-weak"
  | "active-fair"
  | "active-good"
  | "active-strong";

export const STRENGTH_LABELS: Record<StrengthLevel, string> = {
  0: "",
  1: "Weak",
  2: "Fair",
  3: "Good",
  4: "Strong",
};

export const STRENGTH_CLASSES: Record<StrengthLevel, StrengthClass | ""> = {
  0: "",
  1: "active-weak",
  2: "active-fair",
  3: "active-good",
  4: "active-strong",
};

export const STRENGTH_COLORS: Record<StrengthLevel, string> = {
  0: "transparent",
  1: "#e74c3c",
  2: "#f39c12",
  3: "#2ecc71",
  4: "var(--espresso)",
};

// helper for calculating strength; moved here from types/auth.ts
export function getPasswordStrength(pw: string): StrengthLevel {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score as StrengthLevel;
}