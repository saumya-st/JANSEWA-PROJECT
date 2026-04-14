import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import {
  ArrowLeft,
  BriefcaseBusiness,
  LogIn,
  Moon,
  Sun,
  User,
  Wrench,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getDefaultRoute } from '../utils/roleRoutes';

export const Login = () => {
  const [mode, setMode] = useState('login'); // login | signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mounted, setMounted] = useState(false);

  const { user, login, loginEmail, signup } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = useMemo(() => {
    if (!mounted) return 'light';
    return theme === 'system' ? resolvedTheme : theme;
  }, [mounted, theme, resolvedTheme]);

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || getDefaultRoute(user.role);
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const toggleTheme = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');

  const getFirebaseErrorMessage = (err) => {
    const code = err?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Incorrect email or password.';
      case 'auth/email-already-in-use':
        return 'This email is already in use. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Use at least 6 characters.';
      case 'auth/popup-closed-by-user':
        return 'Popup closed before sign in completed.';
      default:
        return 'Authentication failed. Please try again.';
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    const res = await login();
    if (!res.success) setError(getFirebaseErrorMessage(res.error));

    setLoading(false);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res =
      mode === 'signup'
        ? await signup({ name: name.trim(), email: email.trim(), password })
        : await loginEmail({ email: email.trim(), password });

    if (!res.success) setError(getFirebaseErrorMessage(res.error));

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="max-w-md w-full mx-4">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm shadow-black/10 backdrop-blur transition hover:bg-accent/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </button>

        <div className="bg-card rounded-2xl shadow-xl p-8 animate-card-fade">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                <LogIn className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold mb-2">JanSeva Infra</h1>
              <p className="text-muted-foreground">Civic Issue Reporting System</p>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background/40 px-4 py-2 text-sm transition hover:border-ring"
            >
              {currentTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-muted p-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  mode === 'signup' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Create account
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              New accounts are created as <span className="font-semibold text-foreground">citizen</span> by default. You
              can change the role later in Firebase.
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="mb-1 block text-sm font-medium text-muted-foreground">Full name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition focus:border-ring"
                placeholder="••••••••"
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95"
            >
              {mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center space-x-3 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-foreground" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                <span className="text-foreground font-medium">Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              By default, new users are registered as <span className="font-semibold text-foreground">citizen</span>.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Role-based access for:</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-3.5 w-3.5" />
              </span>
              Citizen
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-chart-3/10 text-chart-3">
                <Wrench className="h-3.5 w-3.5" />
              </span>
              Engineer
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-card text-foreground">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-chart-2/10 text-chart-2">
                <BriefcaseBusiness className="h-3.5 w-3.5" />
              </span>
              Supervisor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
