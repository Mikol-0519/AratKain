import { useState } from 'react';
import '../styles/auth.css';
import LeftPanel from '../components/LeftPanel';
import { supabase } from '../services/supabaseClient';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ForgotPasswordPageProps { onBack: () => void; }

type Step = 1 | 2;

interface StepState {
  step: Step;
  email: string;
  newPassword: string;
  confirmPassword: string;
  loading: boolean;
  success: boolean;
  error: string;
  fieldErrors: Record<string, string>;
}

// ── Slice 1: Step Indicator ─────────────────────────────────────────────────
const StepIndicator = ({ currentStep }: { currentStep: Step }) => (
  <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
    {[1, 2].map(s => (
      <div key={s} style={{
        flex: 1, height: 3, borderRadius: 2,
        background: s <= currentStep ? 'var(--accent)' : 'var(--steam)',
        transition: 'background 0.3s',
      }} />
    ))}
  </div>
);

// ── Slice 2: Email Step ─────────────────────────────────────────────────────
interface EmailStepProps {
  email: string;
  setEmail: (v: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: (v: Record<string, string>) => void;
  loading: boolean;
  onSubmit: () => void;
}

const EmailStep = ({ email, setEmail, fieldErrors, setFieldErrors, loading, onSubmit }: EmailStepProps) => {
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setFieldErrors({});
  };

  return (
  <>
    <div className="form-group">
      <label className="form-label">Email Address</label>
      <input
        className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={e => handleEmailChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
        autoFocus
      />
      {fieldErrors.email && (
        <div className="field-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {fieldErrors.email}
        </div>
      )}
    </div>
    <button className="btn-primary" onClick={onSubmit} disabled={loading}>
      {loading ? <span className="spinner" /> : 'Find My Account →'}
    </button>
  </>
  );
};

// ── Slice 3: Password Reset Step ─────────────────────────────────────────────
interface PasswordStepProps {
  email: string;
  newPassword: string;
  setNewPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: (v: Record<string, string>) => void;
  loading: boolean;
  onSubmit: () => void;
}

const PasswordStep = ({ 
  email, newPassword, setNewPassword, confirmPassword, setConfirmPassword,
  fieldErrors, setFieldErrors, loading, onSubmit 
}: PasswordStepProps) => {
  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);
    setFieldErrors({ ...fieldErrors, newPassword: '' });
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    setFieldErrors({ ...fieldErrors, confirmPassword: '' });
  };

  return (
  <>
    <div className="form-group">
      <label className="form-label">New Password</label>
      <input
        className={`form-input${fieldErrors.newPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={newPassword}
        onChange={e => handleNewPasswordChange(e.target.value)}
        autoFocus
      />
      {fieldErrors.newPassword && (
        <div className="field-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {fieldErrors.newPassword}
        </div>
      )}
    </div>
    <div className="form-group">
      <label className="form-label">Confirm New Password</label>
      <input
        className={`form-input${fieldErrors.confirmPassword ? ' input-error' : ''}`}
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={e => handleConfirmPasswordChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && onSubmit()}
      />
      {fieldErrors.confirmPassword && (
        <div className="field-error">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {fieldErrors.confirmPassword}
        </div>
      )}
    </div>
    <button className="btn-primary" onClick={onSubmit} disabled={loading}>
      {loading ? <span className="spinner" /> : 'Update Password'}
    </button>
  </>
  );
};

// ── Slice 4: Success View ────────────────────────────────────────────────────
const SuccessView = ({ onBack }: { onBack: () => void }) => (
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
    <button className="btn-primary" onClick={onBack}>
      Go to Login
    </button>
  </div>
);

// ── Slice 5: Error Banner ───────────────────────────────────────────────────
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

// ── Main Component ───────────────────────────────────────────────────────────
export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [state, setState] = useState<StepState>({
    step: 1, email: '', newPassword: '', confirmPassword: '',
    loading: false, success: false, error: '', fieldErrors: {},
  });

  const update = (partial: Partial<StepState>) => setState(p => ({ ...p, ...partial }));

  // ── Step 1 Logic ───────────────────────────────────────────────────────────
  const handleFindAccount = async () => {
    update({ error: '', fieldErrors: {} });

    if (!state.email.trim()) { update({ fieldErrors: { email: 'Email is required' } }); return; }
    if (!state.email.includes('@')) { update({ fieldErrors: { email: 'Enter a valid email address' } }); return; }

    update({ loading: true });
    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select('email')
        .eq('email', state.email.toLowerCase().trim())
        .maybeSingle();

      if (dbError) { update({ error: 'Something went wrong. Please try again.', loading: false }); return; }
      if (!data) { update({ fieldErrors: { email: 'No account found with this email address.' }, loading: false }); return; }

      update({ step: 2, loading: false });
    } catch { update({ error: 'An unexpected error occurred.', loading: false }); }
  };

  // ── Step 2 Logic ───────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    update({ error: '', fieldErrors: {} });

    const errors: Record<string, string> = {};
    if (!state.newPassword) errors.newPassword = 'New password is required';
    else if (state.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (state.newPassword !== state.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    if (Object.keys(errors).length > 0) { update({ fieldErrors: errors }); return; }

    update({ loading: true });
    try {
      const { error } = await supabase.rpc('reset_user_password', {
        user_email: state.email.toLowerCase().trim(),
        new_password: state.newPassword,
      });

      if (error) { update({ error: 'Unable to reset password. Please try again.', loading: false }); return; }
      update({ success: true, loading: false });
    } catch { update({ error: 'An unexpected error occurred.', loading: false }); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView onBack={onBack} />
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
            <div className="form-eyebrow">{state.step === 1 ? 'Account Recovery' : 'Set New Password'}</div>
            <div className="form-title">{state.step === 1 ? <>Forgot<br />Password?</> : <>Create New<br />Password</>}</div>
            <div className="form-subtitle">
              {state.step === 1 ? 'Enter your email address to find your account' : `Setting new password for ${state.email}`}
            </div>
          </div>

          <StepIndicator currentStep={state.step} />
          <ErrorBanner error={state.error} />

          {state.step === 1 && (
            <EmailStep
              email={state.email} setEmail={v => update({ email: v })}
              fieldErrors={state.fieldErrors} setFieldErrors={v => update({ fieldErrors: v })}
              loading={state.loading} onSubmit={handleFindAccount}
            />
          )}

          {state.step === 2 && (
            <PasswordStep
              email={state.email}
              newPassword={state.newPassword} setNewPassword={v => update({ newPassword: v })}
              confirmPassword={state.confirmPassword} setConfirmPassword={v => update({ confirmPassword: v })}
              fieldErrors={state.fieldErrors} setFieldErrors={v => update({ fieldErrors: v })}
              loading={state.loading} onSubmit={handleResetPassword}
            />
          )}
        </div>

        {state.step === 2 && (
          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <button
              onClick={() => update({ step: 1, fieldErrors: {}, error: '' })}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              ← Use a different email
            </button>
          </div>
        )}

        <div className="divider"><span>or</span></div>

        <div className="switch-link">
          <button onClick={onBack}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
}