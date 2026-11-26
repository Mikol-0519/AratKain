import { useState, KeyboardEvent } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import LeftPanel from '../components/LeftPanel';
import { loginUser, AuthError, AuthUser } from '../services/authService';
import { FormStatus, isSubmitting } from '../machines/formStatus';
import { describeAuthError } from '../machines/authErrors';

// ── Types ──────────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onSwitch:         (mode: AuthMode) => void;
  onSuccess:        (user: AuthUser) => void;
  onForgotPassword: () => void;
}

interface LoginValues {
  email: string;
  password: string;
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
  const [values, setValues] = useState<LoginValues>({ email: '', password: '' });
  const [status, setStatus] = useState<FormStatus>({ status: 'idle' });

  const fieldErrors = status.status === 'invalid' ? status.fieldErrors : {};
  const serverError = status.status === 'failed' ? status.message : '';

  const handleEmailChange = (val: string) => {
    setValues(v => ({ ...v, email: val }));
    setStatus(s => (s.status === 'invalid' ? { status: 'idle' } : s));
  };

  const handlePasswordChange = (val: string) => {
    setValues(v => ({ ...v, password: val }));
    setStatus(s => (s.status === 'invalid' ? { status: 'idle' } : s));
  };

  const handleSubmit = async (): Promise<void> => {
    setStatus({ status: 'submitting' });

    try {
      const user = await loginUser(values.email, values.password);
      onSuccess(user);
    } catch (err) {
      const failure = describeAuthError(err as AuthError);
      setStatus(
        failure.kind === 'fields'
          ? { status: 'invalid', fieldErrors: failure.fieldErrors }
          : { status: 'failed', message: failure.message },
      );
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
          <ErrorBanner error={serverError} />
          <EmailInput
            value={values.email}
            onChange={handleEmailChange}
            error={fieldErrors.email}
          />
          <PasswordInput
            value={values.password}
            onChange={handlePasswordChange}
            error={fieldErrors.password}
            onForgotPassword={onForgotPassword}
          />
          <SubmitButton loading={isSubmitting(status)} onClick={handleSubmit} />
          <Footer onSwitch={onSwitch} />
        </div>
      </div>
    </div>
  );
}
