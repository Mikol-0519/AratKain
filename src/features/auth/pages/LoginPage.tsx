import { useState, KeyboardEvent } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import LeftPanel from '../components/LeftPanel';
import { loginUser, AuthError, AuthUser } from '../services/authService';

// ── Types ──────────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onSwitch:         (mode: AuthMode) => void;
  onSuccess:        (user: AuthUser) => void;
  onForgotPassword: () => void;
}

interface LoginState {
  email: string;
  password: string;
  fieldErrors: Record<string, string>;
  serverError: string;
  loading: boolean;
}

// ── Slice 1: Form Header ─────────────────────────────────────────────────────
const FormHeader = () => (
  <div className="form-header">
    <div className="form-eyebrow">Welcome back</div>
    <div className="form-title">Login</div>
    <div className="form-subtitle">Sign in to discover nearby spots</div>
  </div>
);

// ── Slice 2: Error Banner ───────────────────────────────────────────────────
const ErrorBanner = ({ error }: { error: string }) => {
  if (!error) return null;
  return (
    <div className="error-banner" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8"  x2="12"    y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {error}
    </div>
  );
};

// ── Slice 3: Email Input ─────────────────────────────────────────────────────
interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const EmailInput = ({ value, onChange, error }: EmailInputProps) => (
  <FormInput
    label="Email"
    type="email"
    placeholder="you@example.com"
    value={value}
    onChange={onChange}
    error={error}
  />
);

// ── Slice 4: Password Input ─────────────────────────────────────────────────
interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onForgotPassword: () => void;
}

const PasswordInput = ({ value, onChange, error, onForgotPassword }: PasswordInputProps) => (
  <FormInput
    label="Password"
    type="password"
    placeholder="••••••••"
    value={value}
    onChange={onChange}
    error={error}
  >
    <span className="forgot-link" onClick={onForgotPassword}>
      Forgot Password?
    </span>
  </FormInput>
);

// ── Slice 5: Submit Button ───────────────────────────────────────────────────
const SubmitButton = ({ loading, onClick }: { loading: boolean; onClick: () => void }) => (
  <button
    className="btn-primary"
    onClick={onClick}
    disabled={loading}
  >
    {loading ? <span className="spinner" /> : 'Login'}
  </button>
);

// ── Slice 6: Footer (divider + switch) ───────────────────────────────────────
interface FooterProps {
  onSwitch: (mode: AuthMode) => void;
}

const Footer = ({ onSwitch }: FooterProps) => (
  <>
    <div className="divider"><span>or</span></div>
    <div className="switch-link">
      Don&apos;t have an account?{' '}
      <button onClick={() => onSwitch('register')}>Register</button>
    </div>
  </>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function LoginPage({ onSwitch, onSuccess, onForgotPassword }: LoginPageProps) {
  const [state, setState] = useState<LoginState>({
    email: '', password: '', fieldErrors: {}, serverError: '', loading: false,
  });

  const update = (partial: Partial<LoginState>) => setState(p => ({ ...p, ...partial }));

  // Clear field error when user types
  const handleEmailChange = (val: string) => {
    update({ email: val, fieldErrors: { ...state.fieldErrors, email: '' }, serverError: '' });
  };

  const handlePasswordChange = (val: string) => {
    update({ password: val, fieldErrors: { ...state.fieldErrors, password: '' }, serverError: '' });
  };

  const handleSubmit = async (): Promise<void> => {
    update({ loading: true, serverError: '', fieldErrors: {} });

    try {
      const user = await loginUser(state.email, state.password);
      onSuccess(user);
    } catch (err) {
      const authErr = err as AuthError;
      switch (authErr.type) {
        case 'VALIDATION_ERROR':
          update({ fieldErrors: authErr.fieldErrors ?? {}, loading: false });
          break;
        case 'INVALID_CREDENTIALS':
          update({ serverError: 'Invalid email or password. Please check your credentials and try again.', loading: false });
          break;
        case 'SERVER_ERROR':
        default:
          update({ serverError: 'A server error occurred. Please try again later.', loading: false });
          break;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="auth-container">
      <LeftPanel />
      <div className="right-panel">
        <div className="form-card fade-in" onKeyDown={handleKeyDown}>
          <FormHeader />
          <ErrorBanner error={state.serverError} />
          <EmailInput
            value={state.email}
            onChange={handleEmailChange}
            error={state.fieldErrors.email}
          />
          <PasswordInput
            value={state.password}
            onChange={handlePasswordChange}
            error={state.fieldErrors.password}
            onForgotPassword={onForgotPassword}
          />
          <SubmitButton loading={state.loading} onClick={handleSubmit} />
          <Footer onSwitch={onSwitch} />
        </div>
      </div>
    </div>
  );
}