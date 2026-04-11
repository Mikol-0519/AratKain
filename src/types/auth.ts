// Add AppPage for routing
export type AuthMode = 'login' | 'register';
export type AppPage  = 'landing' | 'login' | 'register' | 'dashboard' | 'forgot-password';
 
export interface FormErrors {
  username?:        string;
  fullname?:        string;
  email?:           string;
  password?:        string;
  confirmPassword?: string;
}

export type {
  StrengthLevel,
  StrengthClass,
} from "../utils/auth";

export {
  STRENGTH_LABELS,
  STRENGTH_CLASSES,
  STRENGTH_COLORS,
  getPasswordStrength,
} from "../utils/auth";