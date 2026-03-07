// Add AppPage for routing
export type AppPage = 'login' | 'register' | 'dashboard';

// This file re-exports the shared types and helpers from utils/auth
// so that other parts of the app can import them from a "types" location.

export type {
  AuthMode,
  FormState,
  FormErrors,
  StrengthLevel,
  StrengthClass,
} from "../utils/auth";

export {
  STRENGTH_LABELS,
  STRENGTH_CLASSES,
  STRENGTH_COLORS,
  getPasswordStrength,
} from "../utils/auth";