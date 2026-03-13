import { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { AuthUser } from './services/authService';
import { AppPage } from './types/auth';
import LandingPage  from './pages/auth/LandingPage';
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage     from './pages/auth/HomePage';

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
    return <HomePage onLogout={handleLogout} />;
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
      />
    );
  }

  // Default — landing page
  return (
    <LandingPage
      onLogin={()    => setPage('login')}
      onRegister={() => setPage('register')}
    />
  );
}