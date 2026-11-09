import { useEffect, useState } from 'react';
import '../styles/auth.css';
import LeftPanel from '../components/LeftPanel';
import { supabase } from '../services/supabaseClient';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ResetPasswordPageProps { onDone: () => void; }

interface FormState {
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  success: boolean;
  error: string;
  fieldErrors: Record<string, string>;
}

// ── Slice 1: Error Banner ────────────────────────────────────────────────────
const ErrorBanner = ({ error }: { error: string }) => {
  if (!error) return null;
  return (
    <div className="error-banner" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
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
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      {message}
    </div>
  );
};

// ── Slice 3: Form ─────────────────────────────────────────────────────────────
interface ResetFormProps {
  state: FormState;
  onChange: (partial: Partial<FormState>) => void;
  onSubmit: () => void;
}

const ResetForm = ({ state, onChange, onSubmit }: ResetFormProps) => (
  <>
    <div className="form-group">
      <label className="form-label">New Password</label>
      <input
        className={`form-input${state.fieldErrors.newPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={state.newPassword}
        onChange={e => {
          onChange({ newPassword: e.target.value, fieldErrors: { ...state.fieldErrors, newPassword: '' } });
        }}
        autoFocus
      />
      <FieldError message={state.fieldErrors.newPassword} />
    </div>
    <div className="form-group">
      <label className="form-label">Confirm New Password</label>
      <input
        className={`form-input${state.fieldErrors.confirmPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={state.confirmPassword}
        onChange={e => {
          onChange({ confirmPassword: e.target.value, fieldErrors: { ...state.fieldErrors, confirmPassword: '' } });
        }}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
      />
      <FieldError message={state.fieldErrors.confirmPassword} />
    </div>
    <ErrorBanner error={state.error} />
    <button className="btn-primary" onClick={onSubmit} disabled={state.loading}>
      {state.loading ? <span className="spinner" /> : 'Update Password'}
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
           stroke="white" strokeWidth="2.5">
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
           stroke="white" strokeWidth="2.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
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
  const [state, setState] = useState<FormState>({
    newPassword: '', confirmPassword: '',
    loading: false, success: false, error: '', fieldErrors: {},
  });
  /** null = still checking, true = recovery session present, false = link expired */
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(Boolean(session));
    });
  }, []);

  const update = (partial: Partial<FormState>) => setState(p => ({ ...p, ...partial }));

  const handleSubmit = async () => {
    update({ error: '', fieldErrors: {} });

    const errors: Record<string, string> = {};
    if (!state.newPassword) errors.newPassword = 'New password is required';
    else if (state.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (state.newPassword !== state.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (Object.keys(errors).length > 0) { update({ fieldErrors: errors }); return; }

    update({ loading: true });
    try {
      const { error } = await supabase.auth.updateUser({ password: state.newPassword });

      if (error) {
        update({
          error: error.message.includes('session')
            ? 'This reset link has expired. Request a new reset email from the login page.'
            : 'Unable to update password. Please try again.',
          loading: false,
        });
        return;
      }

      // End the temporary recovery session - the user signs in with the new
      // password afterwards. Never block the success view on sign-out errors.
      await supabase.auth.signOut();
      update({ success: true, loading: false });
    } catch {
      update({ error: 'An unexpected error occurred. Please try again.', loading: false });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView onDone={onDone} />
        </div>
      </div>
    );
  }

  if (hasSession === false) {
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

          {hasSession === null ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem 0' }}>
              <span className="spinner" />
            </div>
          ) : (
            <ResetForm state={state} onChange={update} onSubmit={handleSubmit} />
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
