import { useEffect, useState } from 'react';
import '../styles/auth.css';
import LeftPanel from '../components/LeftPanel';
import { supabase } from '../services/supabaseClient';
import { FormStatus, isSubmitting } from '../machines/formStatus';
import {
  validatePassword,
  validatePasswordConfirmation,
} from '../utils/passwordPolicy';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ResetPasswordPageProps { onDone: () => void; }

interface ResetValues {
  newPassword: string;
  confirmPassword: string;
}

/**
 * Whether the recovery session is usable.
 *
 * Modelled explicitly because `null` used to mean three different things:
 * "still checking", "no session" and "the component has not mounted yet".
 */
type RecoverySessionState = 'checking' | 'active' | 'expired';

// ── Slice 1: Error Banner ───────────────────────────────────────────────────
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

// ── Slice 2: Field Error ─────────────────────────────────────────────────────
const FieldError = ({ message }: { message: string }) => {
  if (!message) return null;
  return (
    <div className="field-error">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8"  x2="12"    y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </div>
  );
};

// ── Slice 3: Form ─────────────────────────────────────────────────────────────
interface ResetFormProps {
  values: ResetValues;
  fieldErrors: Record<string, string>;
  serverError: string;
  loading: boolean;
  onChange: (partial: Partial<ResetValues>) => void;
  onSubmit: () => void;
}

const ResetForm = ({ values, fieldErrors, serverError, loading, onChange, onSubmit }: ResetFormProps) => (
  <>
    <div className="form-group">
      <label className="form-label">New Password</label>
      <input
        className={`form-input${fieldErrors.newPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={values.newPassword}
        onChange={(e) => onChange({ newPassword: e.target.value })}
        autoFocus
      />
      <FieldError message={fieldErrors.newPassword} />
    </div>
    <div className="form-group">
      <label className="form-label">Confirm New Password</label>
      <input
        className={`form-input${fieldErrors.confirmPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={values.confirmPassword}
        onChange={(e) => onChange({ confirmPassword: e.target.value })}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
      />
      <FieldError message={fieldErrors.confirmPassword} />
    </div>
    <ErrorBanner error={serverError} />
    <button className="btn-primary" onClick={onSubmit} disabled={loading}>
      {loading ? <span className="spinner" /> : 'Update Password'}
    </button>
  </>
);

// ── Slice 4: Success View ─────────────────────────────────────────────────────
const SuccessView = ({ onDone }: { onDone: () => void }) => (
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
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#2C1A0E', marginBottom: '0.5rem' }}>
      Password Updated!
    </div>
    <div style={{ fontSize: '0.875rem', color: '#8A7060', marginBottom: '2rem', lineHeight: 1.6 }}>
      Your password has been changed successfully.<br />You can now log in with your new password.
    </div>
    <button className="btn-primary" onClick={onDone}>
      Go to Login
    </button>
  </div>
);

// ── Slice 5: Expired / Invalid Link View ─────────────────────────────────────
const ExpiredView = ({ onDone }: { onDone: () => void }) => (
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
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8"  x2="12"    y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#2C1A0E', marginBottom: '0.5rem' }}>
      Link Expired
    </div>
    <div style={{ fontSize: '0.875rem', color: '#8A7060', marginBottom: '2rem', lineHeight: 1.6 }}>
      This password reset link is invalid or has expired.<br />
      Request a new reset email from the login page.
    </div>
    <button className="btn-primary" onClick={onDone}>
      Back to Login
    </button>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────
/**
 * Password reset page, reached via the link in the recovery email.
 *
 * The recovery link lands here as #access_token=…&type=recovery; supabase-js
 * already saved the recovery session before this component mounts, so the
 * "signed-in" session is short-lived and only permits changing the user's own
 * password via updateUser({ password }).
 */
export default function ResetPasswordPage({ onDone }: ResetPasswordPageProps) {
  const [values, setValues] = useState<ResetValues>({ newPassword: '', confirmPassword: '' });
  const [status, setStatus] = useState<FormStatus>({ status: 'idle' });
  const [sessionState, setSessionState] = useState<RecoverySessionState>('checking');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionState(session ? 'active' : 'expired');
    });
  }, []);

  const fieldErrors = status.status === 'invalid' ? status.fieldErrors : {};
  const serverError = status.status === 'failed' ? status.message : '';

  const update = (partial: Partial<ResetValues>) => {
    setValues(v => ({ ...v, ...partial }));
    setStatus(s => (s.status === 'invalid' ? { status: 'idle' } : s));
  };

  const handleSubmit = async () => {
    const errors: Record<string, string> = {};

    const passwordError = validatePassword(values.newPassword);
    if (passwordError) errors.newPassword = passwordError;

    const mismatchError = validatePasswordConfirmation(values.newPassword, values.confirmPassword);
    if (mismatchError) errors.confirmPassword = mismatchError;

    if (Object.keys(errors).length > 0) {
      setStatus({ status: 'invalid', fieldErrors: errors });
      return;
    }

    setStatus({ status: 'submitting' });
    try {
      const { error } = await supabase.auth.updateUser({ password: values.newPassword });

      if (error) {
        setStatus({
          status: 'failed',
          message: error.message.includes('session')
            ? 'This reset link has expired. Request a new reset email from the login page.'
            : 'Unable to update password. Please try again.',
        });
        return;
      }

      // End the temporary recovery session - the user signs in with the new
      // password afterwards. Never block the success view on sign-out errors.
      await supabase.auth.signOut();
      setStatus({ status: 'succeeded' });
    } catch {
      setStatus({ status: 'failed', message: 'An unexpected error occurred. Please try again.' });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (status.status === 'succeeded') {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView onDone={onDone} />
        </div>
      </div>
    );
  }

  if (sessionState === 'expired') {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <ExpiredView onDone={onDone} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <LeftPanel />
      <div className="right-panel">
        <div className="form-card fade-in">
          <div className="form-header">
            <div className="form-eyebrow">Set New Password</div>
            <div className="form-title">Create New<br />Password</div>
            <div className="form-subtitle">
              Choose a new password for your account
            </div>
          </div>

          {sessionState === 'checking' ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
              <span className="spinner" />
            </div>
          ) : (
            <ResetForm
              values={values}
              fieldErrors={fieldErrors}
              serverError={serverError}
              loading={isSubmitting(status)}
              onChange={update}
              onSubmit={handleSubmit}
            />
          )}
        </div>

        <div className="divider"><span>or</span></div>

        <div className="switch-link">
          <button onClick={onDone}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
}
