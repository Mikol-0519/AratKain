import { useState, KeyboardEvent } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import StrengthMeter from '../components/StrengthMeter';
import LeftPanel from '../components/LeftPanel';
import { registerUser, AuthError, AuthUser } from '../services/authService';
import { getPasswordStrength } from '../utils/PasswordStrength';

// ── Types ──────────────────────────────────────────────────────────────────────
interface RegisterPageProps {
  onSwitch:  (mode: AuthMode) => void;
  onSuccess: (user: AuthUser) => void;
}

interface RegisterState {
  username: string;
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
  fieldErrors: Record<string, string>;
  serverError: string;
  loading: boolean;
  registered: boolean;
  registeredUser: AuthUser | null;
}

// ── Slice 1: Form Header ─────────────────────────────────────────────────────
const FormHeader = () => (
  <div className="form-header">
    <div className="form-eyebrow">Join AratKain</div>
    <div className="form-title">Create New<br />Account</div>
    <div className="form-subtitle">Start your food discovery journey</div>
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

// ── Slice 3: Text Inputs (Email, Username, Fullname) ───────────────────────
interface TextInputsProps {
  email: string;
  setEmail: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  fullname: string;
  setFullname: (v: string) => void;
  fieldErrors: Record<string, string>;
  clearField: (field: string) => void;
}

const TextInputs = ({ email, setEmail, username, setUsername, fullname, setFullname, fieldErrors, clearField }: TextInputsProps) => (
  <>
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
  </>
);

// ── Slice 4: Password Input with Strength Meter ─────────────────────────────
interface PasswordInputProps {
  password: string;
  setPassword: (v: string) => void;
  fieldErrors: Record<string, string>;
  clearField: (field: string) => void;
}

const PasswordInput = ({ password, setPassword, fieldErrors, clearField }: PasswordInputProps) => {
  const strength = getPasswordStrength(password);
  return (
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
  );
};

// ── Slice 5: Confirm Password Input ─────────────────────────────────────────
interface ConfirmPasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  clearField: (field: string) => void;
}

const ConfirmPasswordInput = ({ value, onChange, error, clearField }: ConfirmPasswordInputProps) => (
  <FormInput
    label="Confirm Password"
    type="password"
    placeholder="••••••••"
    value={value}
    onChange={(v) => { onChange(v); clearField('confirmPassword'); }}
    error={error}
  />
);

// ── Slice 6: Submit Button ───────────────────────────────────────────────────
const SubmitButton = ({ loading, onClick }: { loading: boolean; onClick: () => void }) => (
  <button
    className="btn-primary"
    onClick={onClick}
    disabled={loading}
  >
    {loading ? <span className="spinner" /> : 'Create Account'}
  </button>
);

// ── Slice 7: Footer (divider + switch) ───────────────────────────────────────
interface FooterProps {
  onSwitch: (mode: AuthMode) => void;
}

const Footer = ({ onSwitch }: FooterProps) => (
  <>
    <div className="divider"><span>or</span></div>
    <div className="switch-link">
      Already have an account?{' '}
      <button onClick={() => onSwitch('login')}>Login</button>
    </div>
  </>
);

// ── Slice 8: Success View ────────────────────────────────────────────────────
interface SuccessViewProps {
  user: AuthUser;
  onSuccess: (user: AuthUser) => void;
  onSwitch: (mode: AuthMode) => void;
}

const SuccessView = ({ user, onSuccess, onSwitch }: SuccessViewProps) => (
  <div className="form-card fade-in" style={{ textAlign: 'center' }}>
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
      {user.username}
    </div>
    <div style={{
      background: '#F7F2EA',
      borderRadius: 12, padding: '1rem',
      fontSize: '0.82rem', color: '#8A7060',
      marginBottom: '2rem', lineHeight: 1.6,
    }}>
      You're all set! Start discovering cafes and restaurants near you.
    </div>
    <button className="btn-primary" onClick={() => onSuccess(user)}>
      Go to Map →
    </button>
    <div className="switch-link" style={{ marginTop: '1rem' }}>
      <button onClick={() => onSwitch('login')}>Back to Login</button>
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage({ onSwitch, onSuccess }: RegisterPageProps) {
  const [state, setState] = useState<RegisterState>({
    username: '', fullname: '', email: '', password: '', confirmPassword: '',
    fieldErrors: {}, serverError: '', loading: false, registered: false, registeredUser: null,
  });

  const update = (partial: Partial<RegisterState>) => setState(p => ({ ...p, ...partial }));

  const clearField = (field: string) => {
    update({ fieldErrors: { ...state.fieldErrors, [field]: '' }, serverError: '' });
  };

  const handleSubmit = async (): Promise<void> => {
    update({ loading: true, serverError: '', fieldErrors: {} });

    try {
      const user = await registerUser(state.username, state.fullname, state.email, state.password, state.confirmPassword);
      update({ registeredUser: user, registered: true, loading: false });
    } catch (err) {
      const authErr = err as AuthError;
      switch (authErr.type) {
        case 'VALIDATION_ERROR':
          update({ fieldErrors: authErr.fieldErrors ?? {}, loading: false });
          break;
        case 'PASSWORD_MISMATCH':
          update({ fieldErrors: { confirmPassword: 'Passwords do not match' }, loading: false });
          break;
        case 'USERNAME_TAKEN':
          update({ fieldErrors: { username: authErr.message }, loading: false });
          break;
        case 'USER_ALREADY_EXISTS':
          update({ serverError: authErr.message, loading: false });
          break;
        default:
          update({ serverError: 'A server error occurred. Please try again later.', loading: false });
          break;
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  // Success Screen
  if (state.registered && state.registeredUser) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView user={state.registeredUser} onSuccess={onSuccess} onSwitch={onSwitch} />
        </div>
      </div>
    );
  }

  // Register Form
  return (
    <div className="auth-container">
      <LeftPanel />
      <div className="right-panel">
        <div className="form-card fade-in" onKeyDown={handleKeyDown}>
          <FormHeader />
          <ErrorBanner error={state.serverError} />
          <TextInputs
            email={state.email} setEmail={v => update({ email: v })}
            username={state.username} setUsername={v => update({ username: v })}
            fullname={state.fullname} setFullname={v => update({ fullname: v })}
            fieldErrors={state.fieldErrors} clearField={clearField}
          />
          <PasswordInput
            password={state.password} setPassword={v => update({ password: v })}
            fieldErrors={state.fieldErrors} clearField={clearField}
          />
          <ConfirmPasswordInput
            value={state.confirmPassword} onChange={v => update({ confirmPassword: v })}
            error={state.fieldErrors.confirmPassword} clearField={clearField}
          />
          <SubmitButton loading={state.loading} onClick={handleSubmit} />
          <Footer onSwitch={onSwitch} />
        </div>
      </div>
    </div>
  );
}