import { useState, useRef, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { AuthUser } from '../services/authService';

interface ProfilePageProps {
  user: AuthUser;
  onBack: () => void;
  onUpdated: (updated: AuthUser) => void;
}

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
    padding: 0 2rem;
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

  .profile-body {
    flex: 1;
    max-width: 560px;
    width: 100%;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
  }

  /* ── Avatar upload ── */
  .avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 2rem;
  }

  .avatar-wrapper {
    position: relative;
    margin-bottom: 0.75rem;
    cursor: pointer;
  }

  .avatar-circle {
    width: 90px;
    height: 90px;
    border-radius: 50%;
    background: var(--espresso);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Playfair Display', serif;
    font-size: 2rem;
    font-weight: 700;
    color: var(--latte);
    box-shadow: 0 4px 20px rgba(44,26,14,0.2);
    overflow: hidden;
    border: 3px solid var(--steam);
    transition: opacity 0.2s;
  }

  .avatar-circle img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-circle:hover { opacity: 0.85; }

  .avatar-upload-overlay {
    position: absolute;
    bottom: 0; right: 0;
    width: 28px; height: 28px;
    background: var(--accent);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }

  .avatar-wrapper:hover .avatar-upload-overlay { transform: scale(1.1); }
  .avatar-upload-overlay svg { width: 13px; height: 13px; color: white; }

  .avatar-upload-hint {
    font-size: 0.72rem;
    color: var(--muted);
    margin-top: 4px;
  }

  .avatar-name {
    font-family: 'Playfair Display', serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--espresso);
    margin-top: 2px;
  }

  .avatar-email {
    font-size: 0.8rem;
    color: var(--muted);
    margin-top: 2px;
  }

  /* ── Upload progress ── */
  .upload-progress {
    width: 90px;
    height: 4px;
    background: var(--steam);
    border-radius: 2px;
    margin-top: 8px;
    overflow: hidden;
  }

  .upload-progress-bar {
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  /* ── Cards ── */
  .profile-card {
    background: white;
    border-radius: 16px;
    border: 1px solid var(--steam);
    padding: 1.5rem;
    margin-bottom: 1.25rem;
    box-shadow: 0 2px 12px rgba(44,26,14,0.06);
  }

  .card-title {
    font-family: 'Playfair Display', serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--espresso);
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 8px;
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
    to   { opacity: 1; transform: translateY(0); }
  }

  .save-btn {
    width: 100%;
    padding: 11px;
    border-radius: 10px;
    border: none;
    background: var(--espresso);
    color: var(--cream);
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
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

export default function ProfilePage({ user, onBack, onUpdated }: ProfilePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar state ──────────────────────────────────────────
  const [photoUrl,      setPhotoUrl]      = useState<string | null>(
    () => localStorage.getItem(`aratkain_avatar_${user.id}`) || null
  );

  // Load photo_url from database on mount
  useEffect(() => {
    supabase
      .from('users')
      .select('photo_url')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.photo_url) {
          setPhotoUrl(data.photo_url);
          localStorage.setItem(`aratkain_avatar_${user.id}`, data.photo_url);
        }
      });
  }, [user.id]);
  const [uploading,     setUploading]     = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoError,    setPhotoError]    = useState('');

  // ── Info state ────────────────────────────────────────────
  const [username,        setUsername]        = useState(user.username);
  const [fullname,        setFullname]        = useState(user.fullname);
  const [infoLoading,     setInfoLoading]     = useState(false);
  const [infoSuccess,     setInfoSuccess]     = useState('');
  const [infoError,       setInfoError]       = useState('');
  const [infoFieldErrors, setInfoFieldErrors] = useState<Record<string, string>>({});

  // ── Password state ────────────────────────────────────────
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading,       setPwLoading]       = useState(false);
  const [pwSuccess,       setPwSuccess]       = useState('');
  const [pwError,         setPwError]         = useState('');
  const [pwFieldErrors,   setPwFieldErrors]   = useState<Record<string, string>>({});

  const initials = user.fullname
    ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.username.slice(0, 2).toUpperCase();

  // ── Photo upload ──────────────────────────────────────────
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');

    // Validate type
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('Image must be smaller than 2MB');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Try uploading to Supabase Storage
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;

      setUploadProgress(40);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) {
        // Supabase storage bucket may not exist — fall back to local base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          setPhotoUrl(base64);
          localStorage.setItem(`aratkain_avatar_${user.id}`, base64);

          // Save base64 to users table as fallback
          await supabase
            .from('users')
            .update({ photo_url: base64 })
            .eq('user_id', user.id);

          setUploadProgress(100);
          setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);
        };
        reader.readAsDataURL(file);
        return;
      }

      setUploadProgress(80);

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = data.publicUrl + '?t=' + Date.now();
      setPhotoUrl(url);
      localStorage.setItem(`aratkain_avatar_${user.id}`, url);

      // Save URL to users table
      await supabase
        .from('users')
        .update({ photo_url: data.publicUrl })
        .eq('user_id', user.id);

      setUploadProgress(100);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 500);

    } catch {
      setPhotoError('Failed to upload photo. Please try again.');
      setUploading(false);
      setUploadProgress(0);
    }

    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  // ── Save profile info ─────────────────────────────────────
  const handleSaveInfo = async () => {
    setInfoSuccess(''); setInfoError(''); setInfoFieldErrors({});

    const errors: Record<string, string> = {};
    if (!username.trim())           errors.username = 'Username is required';
    else if (username.length < 3)   errors.username = 'At least 3 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) errors.username = 'Letters, numbers, underscores only';
    if (!fullname.trim())           errors.fullname = 'Full name is required';

    if (Object.keys(errors).length > 0) { setInfoFieldErrors(errors); return; }

    setInfoLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session?.user.id;

      const { error } = await supabase
        .from('users')
        .update({ username, fullname })
        .eq('user_id', userId);

      if (error) {
        if (error.message.includes('username')) {
          setInfoFieldErrors({ username: 'This username is already taken' });
        } else {
          setInfoError('Failed to update profile. Please try again.');
        }
        return;
      }

      setInfoSuccess('Profile updated successfully!');
      onUpdated({ ...user, username, fullname });
    } catch {
      setInfoError('An unexpected error occurred.');
    } finally {
      setInfoLoading(false);
    }
  };

  // ── Save new password ─────────────────────────────────────
  const handleSavePassword = async () => {
    setPwSuccess(''); setPwError(''); setPwFieldErrors({});

    const errors: Record<string, string> = {};
    if (!newPassword)                errors.newPassword     = 'New password is required';
    else if (newPassword.length < 6) errors.newPassword     = 'At least 6 characters';
    if (newPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';

    if (Object.keys(errors).length > 0) { setPwFieldErrors(errors); return; }

    setPwLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setPwError(error.message || 'Failed to update password.'); return; }
      setPwSuccess('Password updated successfully!');
      setNewPassword(''); setConfirmPassword('');
    } catch {
      setPwError('An unexpected error occurred.');
    } finally {
      setPwLoading(false);
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

          {/* ── Avatar ── */}
          <div className="avatar-section">
            <div className="avatar-wrapper" onClick={handlePhotoClick} title="Click to change photo">
              <div className="avatar-circle">
                {photoUrl
                  ? <img src={photoUrl} alt="Profile" />
                  : initials
                }
              </div>
              <div className="avatar-upload-overlay">
                {uploading
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

            {uploading && (
              <div className="upload-progress">
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}

            {photoError && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent)', marginTop: 6 }}>
                {photoError}
              </div>
            )}

            <div className="avatar-upload-hint">
              {uploading ? 'Uploading…' : 'Click photo to change · Max 2MB'}
            </div>

            <div className="avatar-name">{fullname || username}</div>
            <div className="avatar-email">{user.email}</div>
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
            {infoError && (
              <div className="error-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {infoError}
              </div>
            )}

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Username</label>
                <input
                  className={`field-input ${infoFieldErrors.username ? 'error' : ''}`}
                  value={username}
                  onChange={e => { setUsername(e.target.value); setInfoFieldErrors(p => ({...p, username: ''})); }}
                  placeholder="username"
                />
                {infoFieldErrors.username && <span className="field-error">{infoFieldErrors.username}</span>}
              </div>
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input
                  className={`field-input ${infoFieldErrors.fullname ? 'error' : ''}`}
                  value={fullname}
                  onChange={e => { setFullname(e.target.value); setInfoFieldErrors(p => ({...p, fullname: ''})); }}
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

            <button className="save-btn" onClick={handleSaveInfo} disabled={infoLoading}>
              {infoLoading ? <span className="spinner" /> : (
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
            {pwError && (
              <div className="error-banner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {pwError}
              </div>
            )}

            <div className="field-group">
              <label className="field-label">New Password</label>
              <input
                className={`field-input ${pwFieldErrors.newPassword ? 'error' : ''}`}
                type="password" placeholder="••••••••"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setPwFieldErrors(p => ({...p, newPassword: ''})); }}
              />
              {pwFieldErrors.newPassword && <span className="field-error">{pwFieldErrors.newPassword}</span>}
            </div>

            <div className="field-group">
              <label className="field-label">Confirm New Password</label>
              <input
                className={`field-input ${pwFieldErrors.confirmPassword ? 'error' : ''}`}
                type="password" placeholder="••••••••"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); setPwFieldErrors(p => ({...p, confirmPassword: ''})); }}
              />
              {pwFieldErrors.confirmPassword && <span className="field-error">{pwFieldErrors.confirmPassword}</span>}
            </div>

            <button className="save-btn" onClick={handleSavePassword} disabled={pwLoading}>
              {pwLoading ? <span className="spinner" /> : (
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
    </>
  );
}