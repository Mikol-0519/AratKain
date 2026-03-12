import { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { AuthUser } from './services/authService';
import { AppPage } from './types/auth';
import LoginPage    from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import HomePage from './pages/auth/HomePage';

export default function App() {
  const [page,    setPage]    = useState<AppPage>('login');
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing Supabase session on mount
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        // Fetch profile from users table
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
    setPage('login');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F7F2EA', fontFamily: 'DM Sans, sans-serif',
        color: '#8A7060', fontSize: '0.875rem',
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

  return (
    <LoginPage
      onSwitch={(mode) => setPage(mode)}
      onSuccess={handleSuccess}
    />
  );
}