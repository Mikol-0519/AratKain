import { useState, KeyboardEvent } from 'react';
import '../styles/auth.css';
import { AuthMode } from '../types/auth';
import FormInput from '../components/FormInput';
import StrengthMeter from '../components/StrengthMeter';
import LeftPanel from '../components/LeftPanel';
import { registerUser, AuthError, AuthUser } from '../services/authService';
import { describeAuthError, FieldErrors } from '../machines/authErrors';
import { getPasswordStrength } from '../utils/passwordPolicy';

// ── Types ──────────────────────────────────────────────────────────────────────
interface RegisterPageProps {
  onSwitch:  (mode: AuthMode) => void;
  onSuccess: (user: AuthUser) => void;
}

interface RegisterValues {
  username: string;
  fullname: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * The register form's state machine.
 *
 * Two terminal states, not one: the account can be usable right away
 * (`confirmed`) or it can be waiting for the user to click the confirmation
 * email (`pending-confirmation`). The old code always took the first path
 * and reported a failed profile insert when the second one was the truth.
 */
type RegisterStatus =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'invalid'; fieldErrors: FieldErrors }
  | { status: 'failed'; message: string }
  | { status: 'confirmed'; user: AuthUser }
  | { status: 'pending-confirmation'; email: string };

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

// ── Slice 3: Text Inputs (Email, Username, Fullname) ────────────────────────
interface TextInputsProps {
  email: string;
  setEmail: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  fullname: string;
  setFullname: (v: string) => void;
  fieldErrors: FieldErrors;
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
  fieldErrors: FieldErrors;
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
      You&apos;re all set! Start discovering cafes and restaurants near you.
    </div>
    <button className="btn-primary" onClick={() => onSuccess(user)}>
      Go to Map →
    </button>
    <div className="switch-link" style={{ marginTop: '1rem' }}>
      <button onClick={() => onSwitch('login')}>Back to Login</button>
    </div>
  </div>
);

// ── Slice 9: Pending confirmation View ───────────────────────────────────────
const PendingConfirmationView = ({ email, onSwitch }: { email: string; onSwitch: (mode: AuthMode) => void }) => (
  <div className="form-card fade-in" style={{ textAlign: 'center' }}>
    <div style={{
      width: 72, height: 72,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #8A4B2C, #b56440)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      margin: '0 auto 1.5rem',
      boxShadow: '0 8px 24px rgba(138,75,44,0.3)',
    }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
           stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6h16v12H4z"/>
        <polyline points="4,7 12,13 20,7"/>
      </svg>
    </div>
    <div style={{
      fontFamily: "'Playfair Display', serif",
      fontSize: '1.75rem', fontWeight: 700,
      color: '#2C1A0E', marginBottom: '0.5rem',
    }}>
      Confirm your email
    </div>
    <div style={{ fontSize: '0.9rem', color: '#8A7060', marginBottom: '2rem', lineHeight: 1.6 }}>
      We sent a confirmation link to <strong>{email}</strong>.<br />
      Open it to activate your account, then sign in.
    </div>
    <button className="btn-primary" onClick={() => onSwitch('login')}>
      Go to Login
    </button>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
export default function RegisterPage({ onSwitch, onSuccess }: RegisterPageProps) {
  const [values, setValues] = useState<RegisterValues>({
    username: '', fullname: '', email: '', password: '', confirmPassword: '',
  });
  const [status, setStatus] = useState<RegisterStatus>({ status: 'idle' });

  const fieldErrors = status.status === 'invalid' ? status.fieldErrors : {};
  const serverError = status.status === 'failed' ? status.message : '';

  const update = (partial: Partial<RegisterValues>) =>
    setValues(v => ({ ...v, ...partial }));

  /** Clear the error for one field as the user types into it. */
  const clearField = (field: string) => {
    setStatus(s => {
      if (s.status !== 'invalid') return s;
      const next: FieldErrors = { ...s.fieldErrors };
      delete next[field];
      return Object.keys(next).length > 0
        ? { status: 'invalid', fieldErrors: next }
        : { status: 'idle' };
    });
  };

  const handleSubmit = async (): Promise<void> => {
    setStatus({ status: 'submitting' });

    try {
      const outcome = await registerUser(
        values.username, values.fullname, values.email,
        values.password, values.confirmPassword,
      );

      if (outcome.status === 'pending-confirmation') {
        setStatus({ status: 'pending-confirmation', email: outcome.email });
      } else {
        setStatus({ status: 'confirmed', user: outcome.user });
      }
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

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (status.status === 'confirmed') {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView user={status.user} onSuccess={onSuccess} onSwitch={onSwitch} />
        </div>
      </div>
    );
  }

  // ── Pending confirmation Screen ────────────────────────────────────────────
  if (status.status === 'pending-confirmation') {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <PendingConfirmationView email={status.email} onSwitch={onSwitch} />
        </div>
      </div>
    );
  }

  // ── Register Form ──────────────────────────────────────────────────────────
  return (
    <div className="auth-container">
      <LeftPanel />
      <div className="right-panel">
        <div className="form-card fade-in" onKeyDown={handleKeyDown}>
          <FormHeader />
          <ErrorBanner error={serverError} />
          <TextInputs
            email={values.email} setEmail={v => update({ email: v })}
            username={values.username} setUsername={v => update({ username: v })}
            fullname={values.fullname} setFullname={v => update({ fullname: v })}
            fieldErrors={fieldErrors} clearField={clearField}
          />
          <PasswordInput
            password={values.password} setPassword={v => update({ password: v })}
            fieldErrors={fieldErrors} clearField={clearField}
          />
          <ConfirmPasswordInput
            value={values.confirmPassword} onChange={v => update({ confirmPassword: v })}
            error={fieldErrors.confirmPassword} clearField={clearField}
          />
          <SubmitButton loading={status.status === 'submitting'} onClick={handleSubmit} />
          <Footer onSwitch={onSwitch} />
        </div>
      </div>
    </div>
  );
}
