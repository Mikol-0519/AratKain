import { useState, useEffect } from 'react';
import { supabase } from './features/auth/services/supabaseClient';
import { AuthUser } from './features/auth/services/authService';
import { AppPage } from './features/auth/types/auth';
import LandingPage        from './features/auth/pages/LandingPage';
import LoginPage          from './features/auth/pages/LoginPage';
import RegisterPage       from './features/auth/pages/RegisterPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import HomePage           from './features/auth/pages/HomePage';

export default function App() {
  const [page,    setPage]    = useState<AppPage>('landing');
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore existing session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username, fullname')
          .eq('user_id', session.user.id)
          .maybeSingle();

        setUser({
          id:       session.user.id,
          email:    session.user.email ?? '',
          username: profile?.username ?? session.user.email?.split('@')[0] ?? '',
          fullname: profile?.fullname ?? '',
        });
        setPage('dashboard');
      }
      setLoading(false);
    });
  }, []);

  const handleSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    setPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setPage('landing');
  };

  const handleUserUpdate = (updated: AuthUser) => {
    setUser(updated);
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#2C1A0E', fontFamily: 'DM Sans, sans-serif',
        color: '#C8A97E', fontSize: '0.875rem',
      }}>
        Loading…
      </div>
    );
  }

  if (page === 'dashboard' && user) {
    return (
      <HomePage
        onLogout={handleLogout}
        user={user}
        onUserUpdate={handleUserUpdate}
      />
    );
  }

  if (page === 'register') {
    return (
      <RegisterPage
        onSwitch={(mode) => setPage(mode)}
        onSuccess={handleSuccess}
      />
    );
  }

  if (page === 'login') {
    return (
      <LoginPage
        onSwitch={(mode) => setPage(mode)}
        onSuccess={handleSuccess}
        onForgotPassword={() => setPage('forgot-password' as AppPage)}
      />
    );
  }

  if (page === ('forgot-password' as AppPage)) {
    return (
      <ForgotPasswordPage
        onBack={() => setPage('login')}
      />
    );
  }

  return (
    <LandingPage
      onLogin={()    => setPage('login')}
      onRegister={() => setPage('register')}
    />
  );
}