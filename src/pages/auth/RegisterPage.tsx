import { useState } from 'react';
import '../../styles/auth.css';
import { AuthMode } from '../../types/auth';
import FormInput from '../../components/auth/FormInput';
import StrengthMeter from '../../components/auth/StrengthMeter';
import LeftPanel from '../../components/auth/LeftPanel';
import { registerUser, AuthError, AuthUser } from '../../services/authService';
import { getPasswordStrength } from '../../utils/PasswordStrength';

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
      onSuccess(user);
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
        case 'SERVER_ERROR':
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
            onChange={(v) => { setEmail(v); clearField('email'); }}
            error={fieldErrors.email}
          />

          {/* ── Username ── */}
          <FormInput
            label="Username"
            placeholder="e.g. foodlover_ph"
            value={username}
            onChange={(v) => { setUsername(v); clearField('username'); }}
            error={fieldErrors.username}
          />

          {/* ── Full Name ── */}
          <FormInput
            label="Full Name"
            placeholder="Your full name"
            value={fullname}
            onChange={(v) => { setFullname(v); clearField('fullname'); }}
            error={fieldErrors.fullname}
          />

          {/* ── Password with strength meter ── */}
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

          {/* ── Confirm Password ── */}
          <FormInput
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); clearField('confirmPassword'); }}
            error={fieldErrors.confirmPassword}
          />

          {/* ── Submit ── */}
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