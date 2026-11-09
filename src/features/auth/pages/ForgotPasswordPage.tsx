import { useState } from 'react';
import '../styles/auth.css';
import LeftPanel from '../components/LeftPanel';
import { supabase } from '../services/supabaseClient';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ForgotPasswordPageProps { onBack: () => void; }

interface ForgotState {
  email: string;
  loading: boolean;
  success: boolean;
  error: string;
  fieldErrors: Record<string, string>;
}

// ── Slice 1: Success View ─────────────────────────────────────────────────────
/**
 * Deliberately generic — Supabase responds 200 whether or not the email
 * exists, so this screen must not reveal that.
 */
const SuccessView = ({ email, onBack }: { email: string; onBack: () => void }) => (
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
        <path d="M4 6h16v12H4z"/>
        <polyline points="4,7 12,13 20,7"/>
      </svg>
    </div>
    <div style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 700, color: '#2C1A0E', marginBottom: '0.5rem' }}>
      Check Your Email
    </div>
    <div style={{ fontSize: '0.875rem', color: '#8A7060', marginBottom: '2rem', lineHeight: 1.6 }}>
      If an account exists for <strong>{email}</strong>,<br />
      a password reset link has been sent.<br />
      The link opens the reset page in your browser.
    </div>
    <button className="btn-primary" onClick={onBack}>
      Back to Login
    </button>
  </div>
);

// ── Slice 2: Error Banner ───────────────────────────────────────────────────
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
/**
 * Single-step forgot-password: ask Supabase to send the recovery email.
 *
 * supabase.auth.resetPasswordForEmail() posts to /auth/v1/recover, which
 * replies 200 {} regardless of whether the address exists (anti-enumeration).
 * the email-existence lookup and the reset_user_password RPC that this page
 * used before were removed — anyone could call that RPC with any email and
 * take over the account. The user completes the reset on the ResetPasswordPage
 * that the email link opens.
 */
export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  const [state, setState] = useState<ForgotState>({
    email: '', loading: false, success: false, error: '', fieldErrors: {},
  });

  const update = (partial: Partial<ForgotState>) => setState(p => ({ ...p, ...partial }));

  const handleSubmit = async () => {
    update({ error: '', fieldErrors: {} });

    if (!state.email.trim()) { update({ fieldErrors: { email: 'Email is required' } }); return; }
    if (!state.email.includes('@')) { update({ fieldErrors: { email: 'Enter a valid email address' } }); return; }

    update({ loading: true });
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        state.email.toLowerCase().trim(),
        // The reset link must open this same site; the redirect URL has to be
        // allow-listed in the Supabase Auth dashboard (see SECURITY.md).
        { redirectTo: window.location.origin },
      );

      if (error) { update({ error: 'Unable to send the reset email. Please try again.', loading: false }); return; }
      update({ success: true, loading: false });
    } catch { update({ error: 'An unexpected error occurred. Please try again.', loading: false }); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (state.success) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
          <SuccessView email={state.email.toLowerCase().trim()} onBack={onBack} />
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
            <div className="form-eyebrow">Account Recovery</div>
            <div className="form-title">Forgot<br />Password?</div>
            <div className="form-subtitle">
              Enter your email address and we'll send you a reset link
            </div>
          </div>

          <ErrorBanner error={state.error} />

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className={`form-input${state.fieldErrors.email ? ' input-error' : ''}`}
              type="email"
              placeholder="you@example.com"
              value={state.email}
              onChange={e => update({ email: e.target.value, fieldErrors: {} })}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            {state.fieldErrors.email && (
              <div className="field-error">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {state.fieldErrors.email}
              </div>
            )}
          </div>
          <button className="btn-primary" onClick={handleSubmit} disabled={state.loading}>
            {state.loading ? <span className="spinner" /> : 'Send Reset Link →'}
          </button>
        </div>

        <div className="divider"><span>or</span></div>

        <div className="switch-link">
          <button onClick={onBack}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
}
