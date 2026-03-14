import { useState } from 'react';
import '../../styles/auth.css';
import LeftPanel from '../../components/auth/LeftPanel';
import { supabase } from '../../services/supabaseClient';

interface ForgotPasswordPageProps {
  onBack: () => void;
}

export default function ForgotPasswordPage({ onBack }: ForgotPasswordPageProps) {
  // Step 1 — find account
  // Step 2 — set new password
  const [step,            setStep]            = useState<1 | 2>(1);
  const [email,           setEmail]           = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [success,         setSuccess]         = useState(false);
  const [error,           setError]           = useState('');
  const [fieldErrors,     setFieldErrors]     = useState<Record<string, string>>({});

  // ── Step 1: Verify email exists ───────────────────────────
  const handleFindAccount = async () => {
    setError('');
    setFieldErrors({});

    if (!email.trim()) { setFieldErrors({ email: 'Email is required' }); return; }
    if (!email.includes('@')) { setFieldErrors({ email: 'Enter a valid email address' }); return; }

    setLoading(true);
    try {
      // Check if the email exists in the users table
      const { data, error: dbError } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (dbError) {
        setError('Something went wrong. Please try again.');
        return;
      }

      if (!data) {
        setFieldErrors({ email: 'No account found with this email address.' });
        return;
      }

      // Account found — move to step 2
      setStep(2);
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Update password directly ─────────────────────
const handleResetPassword = async () => {
  setError('');
  setFieldErrors({});

  const errors: Record<string, string> = {};
  if (!newPassword)                errors.newPassword = 'New password is required';
  else if (newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
  if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
  if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

  setLoading(true);
  try {
    // Use Supabase Admin RPC to update password directly by email
    const { error } = await supabase.rpc('reset_user_password', {
      user_email: email.toLowerCase().trim(),
      new_password: newPassword,
    });

    if (error) {
      setError('Unable to reset password. Please try again.');
      return;
    }

    setSuccess(true);
  } catch {
    setError('An unexpected error occurred.');
  } finally {
    setLoading(false);
  }
};

  // ── Success screen ────────────────────────────────────────
  if (success) {
    return (
      <div className="auth-container">
        <LeftPanel />
        <div className="right-panel">
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
            <div className="form-eyebrow">
              {step === 1 ? 'Account Recovery' : 'Set New Password'}
            </div>
            <div className="form-title">
              {step === 1 ? <>Forgot<br />Password?</> : <>Create New<br />Password</>}
            </div>
            <div className="form-subtitle">
              {step === 1
                ? 'Enter your email address to find your account'
                : `Setting new password for ${email}`
              }
            </div>
          </div>

          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: s <= step ? 'var(--accent)' : 'var(--steam)',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          {/* Global error */}
          {error && (
            <div className="error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className={`form-input${fieldErrors.email ? ' input-error' : ''}`}
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setFieldErrors({}); }}
                  onKeyDown={e => e.key === 'Enter' && handleFindAccount()}
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

              <button className="btn-primary" onClick={handleFindAccount} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Find My Account →'}
              </button>
            </>
          )}

          {/* ── Step 2: New Password ── */}
          {step === 2 && (
            <>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  className={`form-input${fieldErrors.newPassword ? ' input-error' : ''}`}
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setFieldErrors(p => ({...p, newPassword: ''})); }}
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
                  onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(p => ({...p, confirmPassword: ''})); }}
                  onKeyDown={e => e.key === 'Enter' && handleResetPassword()}
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

              <button className="btn-primary" onClick={handleResetPassword} disabled={loading}>
                {loading ? <span className="spinner" /> : 'Update Password'}
              </button>

              <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                <button
                  onClick={() => { setStep(1); setFieldErrors({}); setError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  ← Use a different email
                </button>
              </div>
            </>
          )}

          <div className="divider"><span>or</span></div>

          <div className="switch-link">
            <button onClick={onBack}>← Back to Login</button>
          </div>

        </div>
      </div>
    </div>
  );
}