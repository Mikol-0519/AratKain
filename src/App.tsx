import { useState, useEffect, useCallback } from 'react';
import { supabase, isRecoveryCallback, watchForRecoveryNavigation } from './features/auth/services/supabaseClient';
import { AuthUser, fetchAuthUser } from './features/auth/services/authService';
import { AppState, AuthRoute } from './features/auth/machines/appState';
import LandingPage        from './features/auth/pages/LandingPage';
import LoginPage          from './features/auth/pages/LoginPage';
import RegisterPage       from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage  from './features/auth/pages/ResetPasswordPage';
import HomePage           from './features/discovery/pages/HomePage';

/**
 * The application shell.
 *
 * The whole app is one state machine (see `features/auth/machines/appState.ts`).
 * `page`, `user` and `loading` used to be three independent values, which
 * made combinations like "on the dashboard with no user" representable.
 */
export default function App() {
  const [state, setState] = useState<AppState>(() =>
    // A recovery link must open the reset form, so the session restore is
    // skipped entirely for that entry mode (see `isRecoveryCallback`).
    isRecoveryCallback
      ? { status: 'signed-out', route: 'reset-password' }
      : { status: 'restoring' },
  );
  const [backendReady, setBackendReady] = useState(false);

  /**
   * The backend is on Render's free tier: after ~15 minutes idle it sleeps,
   * and the first request can take up to a minute to wake it. Ping the health
   * endpoint (through the same /api proxy the app uses) until it answers so
   * the dashboard does not report a cold start as "backend down".
   */
  useEffect(() => {
    let cancelled = false;
    const wake = async () => {
      for (let attempt = 0; attempt < 60; attempt++) {
        try {
          const res = await fetch('/api/auth/health');
          if (res.ok) break;
        } catch { /* still waking up */ }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!cancelled) setBackendReady(true);
    };
    wake();
    return () => { cancelled = true; };
  }, []);

  // A recovery link that arrives while the app is already open is a
  // fragment-only navigation - the document is never reloaded, so the entry
  // mode captured at module load stays stale and the reset form never opens.
  useEffect(() => watchForRecoveryNavigation(), []);

  // Restore existing session on mount
  useEffect(() => {
    if (isRecoveryCallback) return;

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;

      if (session?.user) {
        const user = await fetchAuthUser(session.user.id, session.user.email ?? '');
        if (cancelled) return;
        setState({ status: 'signed-in', user });
      } else {
        setState({ status: 'signed-out', route: 'landing' });
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Keep the app in sync with the auth session.
  //
  // This listener owns exactly one thing: knowing when the session *ended*.
  // It deliberately does not handle SIGNED_IN - the login and register flows
  // already own that transition, and a second writer raced them: signUp
  // emits SIGNED_IN before the profile row is inserted, so the listener's
  // profile lookup found nothing and replaced the user's name with their
  // email prefix while the register success screen was still up.
  //
  // Without this listener the app kept showing the dashboard after the
  // session expired or after the user signed out in another tab.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event !== 'SIGNED_OUT') return;

      // Only a signed-in app reacts. The reset-password flow is already
      // signed out and owns its route - signing out there must not navigate
      // away from the "password updated" screen.
      setState(prev => (prev.status === 'signed-in'
        ? { status: 'signed-out', route: 'landing' }
        : prev));
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSuccess = useCallback((authUser: AuthUser) => {
    setState({ status: 'signed-in', user: authUser });
  }, []);

  const handleLogout = useCallback(() => {
    setState({ status: 'signed-out', route: 'landing' });
  }, []);

  const handleUserUpdate = useCallback((updated: AuthUser) => {
    setState(prev => (prev.status === 'signed-in' ? { ...prev, user: updated } : prev));
  }, []);

  /** Navigate between the signed-out screens. */
  const navigate = useCallback((route: AuthRoute) => {
    setState(prev => (prev.status === 'signed-in' ? prev : { status: 'signed-out', route }));
  }, []);

  if (state.status === 'restoring' || (state.status === 'signed-in' && !backendReady)) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#2C1A0E', fontFamily: 'DM Sans, sans-serif',
        color: '#C8A97E', fontSize: '0.875rem',
      }}>
        {state.status === 'restoring' ? 'Loading…' : 'Starting the backend…'}
      </div>
    );
  }

  if (state.status === 'signed-in') {
    return (
      <HomePage
        onLogout={handleLogout}
        user={state.user}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  switch (state.route) {
    case 'register':
      return (
        <RegisterPage
          onSwitch={(mode) => navigate(mode)}
          onSuccess={handleSuccess}
        />
      );

    case 'login':
      return (
        <LoginPage
          onSwitch={(mode) => navigate(mode)}
          onSuccess={handleSuccess}
          onForgotPassword={() => navigate('forgot-password')}
        />
      );

    case 'forgot-password':
      return (
        <ForgotPasswordPage
          onBack={() => navigate('login')}
        />
      );

    case 'reset-password':
      return (
        <ResetPasswordPage
          onDone={() => navigate('login')}
        />
      );

    case 'landing':
    default:
      return (
        <LandingPage
          onLogin={() => navigate('login')}
          onRegister={() => navigate('register')}
        />
      );
  }
}
