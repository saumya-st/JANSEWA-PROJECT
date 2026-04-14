import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import {
  ArrowRight,
  Sparkles,
  WifiOff,
  Map,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentTheme = useMemo(
    () => (theme === 'system' ? resolvedTheme : theme) ?? 'light',
    [theme, resolvedTheme]
  );

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const toggleTheme = () => setTheme(currentTheme === 'dark' ? 'light' : 'dark');

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute top-32 -right-24 h-96 w-96 rounded-full bg-accent/15 blur-3xl animate-float [animation-delay:250ms]" />
        <div className="absolute -bottom-24 left-1/3 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl animate-float [animation-delay:500ms]" />
      </div>

      <header className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-black/10">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground leading-none">JanSeva Infra</p>
                <p className="font-semibold leading-none">Civic Issue Reporting</p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm font-medium text-foreground shadow-sm shadow-black/10 backdrop-blur transition hover:bg-accent/20"
              aria-label="Toggle theme"
            >
              {currentTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {currentTheme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="animate-card-fade">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-2 text-sm text-muted-foreground shadow-sm shadow-black/10 backdrop-blur">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Role-based access for citizens, engineers, supervisors
              </div>

              <h1 className="mt-6 text-4xl sm:text-5xl font-semibold tracking-tight">
                Report, track, and resolve civic issues — faster.
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
                A modern, offline-first platform with AI-assisted priority prediction and a supervisor map view
                to keep communities moving.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-primary-foreground font-medium shadow-lg shadow-black/10 transition hover:brightness-95"
                >
                  Continue to Login
                  <ArrowRight className="h-5 w-5" />
                </button>

                          </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm shadow-black/10 backdrop-blur animate-card-fade">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <WifiOff className="h-4 w-4 text-primary" />
                    Offline-first
                  </div>
                  <p className="mt-1">Queue reports and auto-sync when online.</p>
                </div>
                <div className="rounded-xl border border-border bg-card/60 p-4 shadow-sm shadow-black/10 backdrop-blur animate-card-fade">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <Map className="h-4 w-4 text-primary" />
                    Map view
                  </div>
                  <p className="mt-1">Visualize and assign issues quickly.</p>
                </div>
              </div>
            </div>

            <div className="animate-card-fade">
              <div className="rounded-3xl border border-border bg-card/70 p-6 sm:p-8 shadow-xl shadow-black/10 backdrop-blur">
                <h2 className="text-xl font-semibold">What you get</h2>
                <p className="mt-2 text-muted-foreground">
                  Built for speed, clarity, and a smooth experience across light/dark themes.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FeatureCard
                    icon={<Sparkles className="h-4 w-4" />}
                    title="AI Priority"
                    description="Predict urgency from the issue description."
                  />
                  <FeatureCard
                    icon={<ShieldCheck className="h-4 w-4" />}
                    title="Role Access"
                    description="Screens and actions based on your role."
                  />
                  <FeatureCard
                    icon={<WifiOff className="h-4 w-4" />}
                    title="Sync Queue"
                    description="Works offline and syncs in the background."
                  />
                  <FeatureCard
                    icon={<Map className="h-4 w-4" />}
                    title="Supervisor Map"
                    description="Markers, details, and engineer assignment."
                  />
                </div>

                <div className="mt-6 rounded-2xl bg-accent/10 border border-border p-4">
                  <p className="text-sm text-muted-foreground">
                    Tip: Use the theme toggle to preview light/dark styling before logging in.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 text-sm text-muted-foreground flex items-center justify-between">
          <span>© {new Date().getFullYear()} JanSeva Infra</span>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4 shadow-sm shadow-black/10 transition hover:bg-accent/10">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        {title}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
};
