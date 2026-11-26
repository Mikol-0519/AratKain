import { useState, useRef, useEffect } from 'react';
import { supabase } from '../../auth/services/supabaseClient';
import { AuthUser } from '../../auth/services/authService';
import { FormStatus, isSubmitting } from '../../auth/machines/formStatus';
import {
  validatePassword,
  validatePasswordConfirmation,
} from '../../auth/utils/passwordPolicy';

// ── Types ──────────────────────────────────────────────────────
interface ProfilePageProps {
  user: AuthUser;
  onBack: () => void;
  onUpdated: (updated: AuthUser) => void;
}

/**
 * The avatar upload state machine.
 *
 * Uploading used to be three independent values (`uploading`, `uploadProgress`,
 * `photoError`) plus a `photoUrl` that was written to the database and to
 * localStorage with two *different* strings (one with a cache-busting
 * timestamp, one without), so the cache and the database always disagreed.
 */
type AvatarState =
  | { status: 'idle'; url: string | null }
  | { status: 'uploading'; url: string | null; progress: number }
  | { status: 'error'; url: string | null; message: string };

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --cream: #F7F2EA;
    --espresso: #2C1A0E;
    --latte: #C8A97E;
    --steam: #E8DDD0;
    --accent: #B85C38;
    --muted: #8A7060;
  }

  .profile-page {
    min-height: 100vh;
    background: var(--cream);
    font-family: 'DM Sans', sans-serif;
    display: flex;
    flex-direction: column;
  }

  .profile-topbar {
    background: var(--espresso);
    padding: 0 2.5rem;
    height: 60px;
    display: flex;
    align-items: center;
    gap: 1rem;
    box-shadow: 0 2px 12px rgba(44,26,14,0.25);
    flex-shrink: 0;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: transparent;
    border: none;
    color: var(--latte);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    padding: 6px 10px;
    border-radius: 8px;
    transition: background 0.2s;
  }
  .back-btn:hover { background: rgba(200,169,126,0.1); }
  .back-btn svg { width: 16px; height: 16px; }

  .profile-topbar-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--cream);
  }

  /* ── Two-column layout ── */
  .profile-body {
    flex: 1;
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 0;
    min-height: calc(100vh - 60px);
  }

  /* ── Left sidebar ── */
  .profile-sidebar {
    background: var(--espresso);
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    overflow: hidden;
  }

  .profile-sidebar::before {
    content: '';
    position: absolute;
    top: -80px; right: -80px;
    width: 240px; height: 240px;
    border-radius: 50%;
    background: rgba(200,169,126,0.08);
    pointer-events: none;
  }

  .profile-sidebar::after {
    content: '';
    position: absolute;
    bottom: -60px; left: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(200,169,126,0.06);
    pointer-events: none;
  }

  /* ── Right content ── */
  .profile-content {
    padding: 2.5rem 3rem;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .profile-content-header {
    margin-bottom: 0.5rem;
  }

  .profile-content-header h2 {
    font-family: 'Playfair Display', serif;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--espresso);
  }
  .profile-content-header p {
    font-size: 0.85rem;
    color: var(--muted);
    margin-top: 4px;
  }

  /* ── Avatar upload ── */
  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    position: relative;
    z-index: 1;
  }

  .avatar-wrapper {
    position: relative;
    margin-bottom: 0.5rem;
    cursor: pointer;
  }

  .avatar-circle {
    width: 110px;
    height: 110px;
    border-radius: 50%;
    background: rgba(200,169,126,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 2.4rem;
    font-weight: 700;
    color: var(--latte);
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    overflow: hidden;
    border: 3px solid rgba(200,169,126,0.4);
    transition: opacity 0.2s, transform 0.2s;
  }

  .avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-circle:hover { opacity: 0.85; transform: scale(1.02); }

  .avatar-upload-overlay {
    position: absolute;
    bottom: 2px; right: 2px;
    width: 30px; height: 30px;
    border-radius: 50%;
    background: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--espresso);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    transition: transform 0.2s;
  }

  .avatar-wrapper:hover .avatar-upload-overlay { transform: scale(1.1); }
  .avatar-upload-overlay svg { width: 13px; height: 13px; color: white; }

  .avatar-upload-hint {
    font-size: 0.7rem;
    color: rgba(200,169,126,0.6);
    text-align: center;
    line-height: 1.4;
  }

  .avatar-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--cream);
    text-align: center;
    margin-top: 4px;
  }

  .avatar-email {
    font-size: 0.78rem;
    color: var(--latte);
    text-align: center;
    opacity: 0.8;
  }

  /* ── Sidebar divider ── */
  .sidebar-divider {
    width: 100%;
    height: 1px;
    background: rgba(200,169,126,0.15);
    margin: 2.5rem 0;
    position: relative;
    z-index: 1;
  }

  /* ── Sidebar stats ── */
  .sidebar-meta {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    position: relative;
    z-index: 1;
  }

  .sidebar-meta-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(200,169,126,0.07);
    border-radius: 10px;
    border: 1px solid rgba(200,169,126,0.12);
  }

  .sidebar-meta-item svg {
    width: 15px; height: 15px;
    color: var(--latte);
    flex-shrink: 0;
  }

  .sidebar-meta-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(200,169,126,0.55);
  }

  .sidebar-meta-value {
    font-size: 0.82rem;
    color: var(--cream);
    margin-top: 1px;
  }

  /* ── Upload progress ── */
  .upload-progress {
    width: 90px;
    height: 3px;
    background: rgba(200,169,126,0.2);
    border-radius: 2px;
    margin-top: 6px;
    overflow: hidden;
  }

  .upload-progress-bar {
    height: 100%;
    background: var(--latte);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  /* ── Cards ── */
  .profile-card {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--steam);
    padding: 1.75rem;
    box-shadow: 0 2px 12px rgba(44,26,14,0.06);
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1.05rem;
    font-weight: 700;
    color: var(--espresso);
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 8px;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--steam);
  }
  .card-title svg { width: 16px; height: 16px; color: var(--accent); }

  .field-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 1rem;
  }
  .field-group:last-child { margin-bottom: 0; }

  .field-label {
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .field-input {
    padding: 10px 14px;
    border-radius: 10px;
    border: 1.5px solid var(--steam);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.875rem;
    color: var(--espresso);
    background: var(--cream);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    width: 100%;
  }

  .field-input:focus {
    border-color: var(--latte);
    box-shadow: 0 0 0 3px rgba(200,169,126,0.12);
  }
  .field-input.error { border-color: var(--accent); }

  .field-error {
    font-size: 0.72rem;
    color: var(--accent);
  }

  .success-banner {
    background: #EDFAF3;
    border: 1px solid #2C7A4B;
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    color: #2C7A4B;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
    animation: fadeIn 0.3s ease;
  }

  .error-banner {
    background: #FFF0EC;
    border: 1px solid var(--accent);
    border-radius: 10px;
    padding: 10px 14px;
    font-size: 0.82rem;
    color: var(--accent);
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 1rem;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .save-btn {
    padding: 11px 28px;
    border-radius: 10px;
    border: none;
    background: var(--espresso);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1.25rem;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }
  .save-btn:hover:not(:disabled) {
    background: #3d2510;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(44,26,14,0.2);
  }
  .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .save-btn svg { width: 16px; height: 16px; }

  .spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(247,242,234,0.3);
    border-top-color: var(--cream);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

// ── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage({ user, onBack, onUpdated }: ProfilePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar state ──────────────────────────────────────────
  const [avatar, setAvatar] = useState<AvatarState>(() => ({
    status: 'idle',
    url: localStorage.getItem(`aratkain_avatar_${user.id}`) || null,
  }));
  /** Bumped on every successful upload so the browser re-fetches the image. */
  const [avatarVersion, setAvatarVersion] = useState(0);

  // Load photo_url from database on mount
  useEffect(() => {
    supabase
      .from('users')
      .select('photo_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.photo_url) {
          setAvatar(prev => (prev.status === 'uploading' ? prev : { status: 'idle', url: data.photo_url }));
          localStorage.setItem(`aratkain_avatar_${user.id}`, data.photo_url);
        }
      });
  }, [user.id]);

  // ── Info form ─────────────────────────────────────────────
  const [username, setUsername] = useState(user.username);
  const [fullname, setFullname] = useState(user.fullname);
  const [infoStatus, setInfoStatus] = useState<FormStatus>({ status: 'idle' });

  // ── Password form ─────────────────────────────────────────
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwStatus,        setPwStatus]        = useState<FormStatus>({ status: 'idle' });

  const initials = user.fullname
    ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username.slice(0, 2).toUpperCase();

  const infoFieldErrors  = infoStatus.status === 'invalid' ? infoStatus.fieldErrors : {};
  const infoErrorMessage = infoStatus.status === 'failed' ? infoStatus.message : '';
  const infoSuccess      = infoStatus.status === 'succeeded' ? 'Profile updated successfully!' : '';

  const pwFieldErrors    = pwStatus.status === 'invalid' ? pwStatus.fieldErrors : {};
  const pwErrorMessage   = pwStatus.status === 'failed' ? pwStatus.message : '';
  const pwSuccess        = pwStatus.status === 'succeeded' ? 'Password updated successfully!' : '';

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    // Reset the input first so that picking the *same* file again always
    // fires a change event - previously the fallback path returned before
    // this line, so a retry with the same file did nothing.
    e.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatar(prev => ({ status: 'error', url: prev.url, message: 'Please select an image file (JPG, PNG, etc.)' }));
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setAvatar(prev => ({ status: 'error', url: prev.url, message: 'Image must be smaller than 2MB' }));
      return;
    }

    setAvatar(prev => ({ status: 'uploading', url: prev.url, progress: 10 }));

    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;

      setAvatar(prev => (prev.status === 'uploading' ? { ...prev, progress: 40 } : prev));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // The Supabase storage bucket may not exist - fall back to storing the
        // image inline in the users table.
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          await supabase
            .from('users')
            .update({ photo_url: base64 })
            .eq('user_id', user.id);

          localStorage.setItem(`aratkain_avatar_${user.id}`, base64);
          setAvatar({ status: 'idle', url: base64 });
          setAvatarVersion(v => v + 1);
        };
        reader.readAsDataURL(file);
        return;
      }

      setAvatar(prev => (prev.status === 'uploading' ? { ...prev, progress: 80 } : prev));

      // Store the *same* clean URL in the database and in the local cache.
      // They used to differ (the cache had a cache-busting timestamp appended),
      // so the two stores always disagreed about the current avatar.
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = data.publicUrl;

      await supabase
        .from('users')
        .update({ photo_url: publicUrl })
        .eq('user_id', user.id);

      localStorage.setItem(`aratkain_avatar_${user.id}`, publicUrl);
      setAvatar({ status: 'idle', url: publicUrl });
      setAvatarVersion(v => v + 1);
    } catch {
      setAvatar(prev => ({ status: 'error', url: prev.url, message: 'Failed to upload photo. Please try again.' }));
    }
  };

  // ── Save profile info ─────────────────────────────────────
  const handleSaveInfo = async () => {
    const errors: Record<string, string> = {};
    if (!username.trim())           errors.username = 'Username is required';
    else if (username.length < 3)   errors.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Letters, numbers, underscores only';
    if (!fullname.trim())           errors.fullname = 'Full name is required';

    if (Object.keys(errors).length > 0) {
      setInfoStatus({ status: 'invalid', fieldErrors: errors });
      return;
    }

    setInfoStatus({ status: 'submitting' });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user.id;

      if (!userId) {
        setInfoStatus({ status: 'failed', message: 'Your session has expired. Please sign in again.' });
        return;
      }

      const { error } = await supabase
        .from('users')
        .update({ username, fullname })
        .eq('user_id', userId);

      if (error) {
        // 23505 = Postgres unique_violation. Checking the code is reliable;
        // matching on the message text broke whenever Postgres reworded it.
        if (error.code === '23505') {
          setInfoStatus({ status: 'invalid', fieldErrors: { username: 'This username is already taken' } });
        } else {
          setInfoStatus({ status: 'failed', message: 'Failed to update profile. Please try again.' });
        }
        return;
      }

      setInfoStatus({ status: 'succeeded' });
      onUpdated({ ...user, username, fullname });
    } catch {
      setInfoStatus({ status: 'failed', message: 'An unexpected error occurred.' });
    }
  };

  // ── Save new password ─────────────────────────────────────
  const handleSavePassword = async () => {
    const errors: Record<string, string> = {};

    const passwordError = validatePassword(newPassword);
    if (passwordError) errors.newPassword = passwordError;

    const mismatchError = validatePasswordConfirmation(newPassword, confirmPassword);
    if (mismatchError) errors.confirmPassword = mismatchError;

    if (Object.keys(errors).length > 0) {
      setPwStatus({ status: 'invalid', fieldErrors: errors });
      return;
    }

    setPwStatus({ status: 'submitting' });
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setPwStatus({ status: 'failed', message: error.message || 'Failed to update password.' });
        return;
      }
      setPwStatus({ status: 'succeeded' });
      setNewPassword(''); setConfirmPassword('');
    } catch {
      setPwStatus({ status: 'failed', message: 'An unexpected error occurred.' });
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="profile-page">

        {/* Top bar */}
        <div className="profile-topbar">
          <button className="back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="12" x2="5" y2="12"/>
              <polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Map
          </button>
          <span className="profile-topbar-title">My Profile</span>
        </div>

        <div className="profile-body">

          {/* ── Left Sidebar ── */}
          <div className="profile-sidebar">
            <div className="avatar-section">
              <div className="avatar-wrapper" onClick={handlePhotoClick} title="Click to change photo">
                <div className="avatar-circle">
                  {avatar.url
                    ? <img src={`${avatar.url}${avatar.url.includes('?') ? '&' : '?'}v=${avatarVersion}`} alt="Profile" />
                    : initials
                  }
                </div>
                <div className="avatar-upload-overlay">
                  {avatar.status === 'uploading'
                    ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 0.7s linear infinite' }}>
                        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                      </svg>
                    : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                  }
                </div>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />

              {avatar.status === 'uploading' && (
                <div className="upload-progress">
                  <div className="upload-progress-bar" style={{ width: `${avatar.progress}%` }} />
                </div>
              )}

              {avatar.status === 'error' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--latte)', marginTop: 4, textAlign: 'center' }}>
                  {avatar.message}
                </div>
              )}

              <div className="avatar-upload-hint">
                {avatar.status === 'uploading' ? 'Uploading…' : 'Click photo to change · Max 2MB'}
              </div>

              <div className="avatar-name">{fullname || username}</div>
              <div className="avatar-email">{user.email}</div>
            </div>

            <div className="sidebar-divider" />

            <div className="sidebar-meta">
              <div className="sidebar-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <div>
                  <div className="sidebar-meta-label">Username</div>
                  <div className="sidebar-meta-value">@{username}</div>
                </div>
              </div>
              <div className="sidebar-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 6h20v12H2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <div>
                  <div className="sidebar-meta-label">Email</div>
                  <div className="sidebar-meta-value" style={{ wordBreak: 'break-all', fontSize: '0.78rem' }}>{user.email}</div>
                </div>
              </div>
              <div className="sidebar-meta-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <div>
                  <div className="sidebar-meta-label">Password</div>
                  <div className="sidebar-meta-value">••••••••</div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Right Content ── */}
          <div className="profile-content">
            <div className="profile-content-header">
              <h2>Account Settings</h2>
              <p>Manage your personal information and security preferences</p>
            </div>

            {/* ── Profile Info Card ── */}
            <div className="profile-card">
              <div className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Personal Information
              </div>

              {infoSuccess && (
                <div className="success-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {infoSuccess}
                </div>
              )}
              {infoErrorMessage && (
                <div className="error-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {infoErrorMessage}
                </div>
              )}

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">Username</label>
                  <input
                    className={`field-input ${infoFieldErrors.username ? 'error' : ''}`}
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value);
                      setInfoStatus(s => s.status === 'invalid' ? { status: 'idle' } : s);
                    }}
                    placeholder="username"
                  />
                  {infoFieldErrors.username && <span className="field-error">{infoFieldErrors.username}</span>}
                </div>
                <div className="field-group">
                  <label className="field-label">Full Name</label>
                  <input
                    className={`field-input ${infoFieldErrors.fullname ? 'error' : ''}`}
                    value={fullname}
                    onChange={e => {
                      setFullname(e.target.value);
                      setInfoStatus(s => s.status === 'invalid' ? { status: 'idle' } : s);
                    }}
                    placeholder="Your full name"
                  />
                  {infoFieldErrors.fullname && <span className="field-error">{infoFieldErrors.fullname}</span>}
                </div>
              </div>

              <div className="field-group">
                <label className="field-label">Email</label>
                <input
                  className="field-input"
                  value={user.email}
                  disabled
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Email cannot be changed</span>
              </div>

              <button className="save-btn" onClick={handleSaveInfo} disabled={isSubmitting(infoStatus)}>
                {isSubmitting(infoStatus) ? <span className="spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                      <polyline points="17 21 17 13 7 13 7 21"/>
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            </div>

            {/* ── Change Password Card ── */}
            <div className="profile-card">
              <div className="card-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Change Password
              </div>

              {pwSuccess && (
                <div className="success-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {pwSuccess}
                </div>
              )}
              {pwErrorMessage && (
                <div className="error-banner">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {pwErrorMessage}
                </div>
              )}

              <div className="field-row">
                <div className="field-group">
                  <label className="field-label">New Password</label>
                  <input
                    className={`field-input ${pwFieldErrors.newPassword ? 'error' : ''}`}
                    type="password" placeholder="••••••••"
                    value={newPassword}
                    onChange={e => {
                      setNewPassword(e.target.value);
                      setPwStatus(s => s.status === 'invalid' ? { status: 'idle' } : s);
                    }}
                  />
                  {pwFieldErrors.newPassword && <span className="field-error">{pwFieldErrors.newPassword}</span>}
                </div>
                <div className="field-group">
                  <label className="field-label">Confirm New Password</label>
                  <input
                    className={`field-input ${pwFieldErrors.confirmPassword ? 'error' : ''}`}
                    type="password" placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => {
                      setConfirmPassword(e.target.value);
                      setPwStatus(s => s.status === 'invalid' ? { status: 'idle' } : s);
                    }}
                  />
                  {pwFieldErrors.confirmPassword && <span className="field-error">{pwFieldErrors.confirmPassword}</span>}
                </div>
              </div>

              <button className="save-btn" onClick={handleSavePassword} disabled={isSubmitting(pwStatus)}>
                {isSubmitting(pwStatus) ? <span className="spinner" /> : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    Update Password
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
