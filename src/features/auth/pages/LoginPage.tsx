import { useState } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import LeftPanel from '../components/LeftPanel';
import { loginUser, AuthError, AuthUser } from '../services/authService';

interface LoginPageProps {
  onSwitch:         (mode: AuthMode) => void;
  onSuccess:        (user: AuthUser) => void;
  onForgotPassword: () => void;
}

export default function LoginPage({ onSwitch, onSuccess, onForgotPassword }: LoginPageProps) {
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [loading,     setLoading]     = useState(false);

  // Clear a specific field error when user starts typing
  const handleEmailChange = (val: string) => {
    setEmail(val);
    setFieldErrors((p) => ({ ...p, email: '' }));
    setServerError('');
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    setFieldErrors((p) => ({ ...p, password: '' }));
    setServerError('');
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setServerError('');
    setFieldErrors({});

    try {
      const user = await loginUser(email, password);
      onSuccess(user);
    } catch (err) {
      const authErr = err as AuthError;

      switch (authErr.type) {
        case 'VALIDATION_ERROR':
          setFieldErrors(authErr.fieldErrors ?? {});
          break;
        case 'INVALID_CREDENTIALS':
          setServerError('Invalid email or password. Please check your credentials and try again.');
          break;
        case 'SERVER_ERROR':
        default:
          setServerError('A server error occurred. Please try again later.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  // Allow submitting with Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="auth-container">
      <LeftPanel />

      <div className="right-panel">
        <div className="form-card fade-in" onKeyDown={handleKeyDown}>

          <div className="form-header">
            <div className="form-eyebrow">Welcome back</div>
            <div className="form-title">Login</div>
            <div className="form-subtitle">Sign in to discover nearby spots</div>
          </div>

          {/* ── Server / Global Error Banner ── */}
          {serverError && (
            <div className="error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8"  x2="12"    y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {serverError}
            </div>
          )}

          {/* ── Email ── */}
          <FormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={handleEmailChange}
            error={fieldErrors.email}
          />

          {/* ── Password ── */}
          <FormInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={handlePasswordChange}
            error={fieldErrors.password}
          >
            <span className="forgot-link" onClick={onForgotPassword}>
              Forgot Password?
            </span>
          </FormInput>

          {/* ── Submit ── */}
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Login'}
          </button>

          <div className="divider"><span>or</span></div>

          <div className="switch-link">
            Don&apos;t have an account?{' '}
            <button onClick={() => onSwitch('register')}>Register</button>
          </div>

        </div>
      </div>
    </div>
  );
}