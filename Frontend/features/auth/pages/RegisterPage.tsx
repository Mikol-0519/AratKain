import { useState } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import StrengthMeter from '../components/StrengthMeter';
import LeftPanel from '../components/LeftPanel';
import { registerUser, AuthError, AuthUser } from '../services/authService';
import { getPasswordStrength } from '../utils/PasswordStrength';
interface RegisterPageProps {
  onSwitch:  (mode: AuthMode) => void;
  onSuccess: (user: AuthUser) => void;
}

export default function RegisterPage({ onSwitch, onSuccess }: RegisterPageProps) {
  const [username,        setUsername]        = useState('');
  const [fullname,        setFullname]        = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors,     setFieldErrors]     = useState<Record<string, string>>({});
  const [serverError,     setServerError]     = useState('');
  const [loading,         setLoading]         = useState(false);
  const [registered,      setRegistered]      = useState(false);
  const [registeredUser,  setRegisteredUser]  = useState<AuthUser | null>(null);

  const clearField = (field: string) => {
    setFieldErrors((p) => ({ ...p, [field]: '' }));
    setServerError('');
  };

  const handleSubmit = async (): Promise<void> => {
    setLoading(true);
    setServerError('');
    setFieldErrors({});

    try {
      const user = await registerUser(username, fullname, email, password, confirmPassword);
      setRegisteredUser(user);
      setRegistered(true);
    } catch (err) {
      const authErr = err as AuthError;
      switch (authErr.type) {
        case 'VALIDATION_ERROR':
          setFieldErrors(authErr.fieldErrors ?? {});
          break;
        case 'PASSWORD_MISMATCH':
          setFieldErrors({ confirmPassword: 'Passwords do not match' });
          break;
        case 'USERNAME_TAKEN':
          setFieldErrors({ username: authErr.message });
          break;
        case 'USER_ALREADY_EXISTS':
          setServerError(authErr.message);
          break;
        default:
          setServerError('A server error occurred. Please try again later.');
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const strength = getPasswordStrength(password);

  // ── Success Screen ────────────────────────────────────────
  if (registered && registeredUser) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <div className="form-card fade-in" style={{ textAlign: 'center' }}>

            {/* Checkmark */}
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2C7A4B, #3da367)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 24px rgba(44,122,75,0.3)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
                   stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '1.75rem', fontWeight: 700,
              color: '#2C1A0E', marginBottom: '0.5rem',
            }}>
              Welcome to AratKain!
            </div>

            <div style={{ fontSize: '0.9rem', color: '#8A7060', marginBottom: '0.25rem' }}>
              Account created successfully
            </div>

            <div style={{
              fontSize: '1rem', fontWeight: 600,
              color: '#B85C38', marginBottom: '1.5rem',
            }}>
              {registeredUser.username}
            </div>

            <div style={{
              background: '#F7F2EA',
              borderRadius: 12, padding: '1rem',
              fontSize: '0.82rem', color: '#8A7060',
              marginBottom: '2rem', lineHeight: 1.6,
            }}>
              You're all set! Start discovering cafes and restaurants near you.
            </div>

            <button
              className="btn-primary"
              onClick={() => onSuccess(registeredUser)}
            >
              Go to Map →
            </button>

            <div className="switch-link" style={{ marginTop: '1rem' }}>
              <button onClick={() => onSwitch('login')}>Back to Login</button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ── Register Form ─────────────────────────────────────────
  return (
    <div className="auth-container">
      <LeftPanel />

      <div className="right-panel">
        <div className="form-card fade-in" onKeyDown={handleKeyDown}>

          <div className="form-header">
            <div className="form-eyebrow">Join AratKain</div>
            <div className="form-title">Create New<br />Account</div>
            <div className="form-subtitle">Start your food discovery journey</div>
          </div>

          {/* Server Error Banner */}
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

          <FormInput
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(v) => { setEmail(v); clearField('email'); }}
            error={fieldErrors.email}
          />

          <FormInput
            label="Username"
            placeholder="e.g. foodlover_ph"
            value={username}
            onChange={(v) => { setUsername(v); clearField('username'); }}
            error={fieldErrors.username}
          />

          <FormInput
            label="Full Name"
            placeholder="Your full name"
            value={fullname}
            onChange={(v) => { setFullname(v); clearField('fullname'); }}
            error={fieldErrors.fullname}
          />

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input${fieldErrors.password ? ' input-error' : ''}`}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearField('password'); }}
            />
            {password && <StrengthMeter score={strength} />}
            {fieldErrors.password && (
              <div className="field-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8"  x2="12"    y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {fieldErrors.password}
              </div>
            )}
          </div>

          <FormInput
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); clearField('confirmPassword'); }}
            error={fieldErrors.confirmPassword}
          />

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : 'Create Account'}
          </button>

          <div className="divider"><span>or</span></div>

          <div className="switch-link">
            Already have an account?{' '}
            <button onClick={() => onSwitch('login')}>Login</button>
          </div>

        </div>
      </div>
    </div>
  );
}