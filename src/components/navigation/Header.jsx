import { Moon, Sun } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../app/providers/ThemeProvider';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';
import { Button } from '../ui/Button';
import { PageContainer } from '../ui/PageContainer';

export function Header() {
  const { session, isLoading, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const displayName = session?.user?.user_metadata?.display_name?.trim();
  const emailHandle = session?.user?.email?.split('@')[0];
  const accountLabel = displayName || emailHandle || 'Signed in';
  const navigationItems = [
    { label: 'Home', to: '/' },
    { label: 'Explore Calendar', to: '/explore-calendar' },
    { label: 'Favorites', to: '/favorites' },
    { label: 'Explore', to: '/explore' },
    ...(session ? [{ label: 'Admin', to: '/admin' }] : []),
    { label: session ? 'Account' : 'Sign In', to: '/auth' },
  ];

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // Header sign-out should fail quietly; the auth page exposes the detailed error state.
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-white/40 bg-sand/75 backdrop-blur-xl dark:border-slate-900 dark:bg-[#0a0a0a]/90 dark:backdrop-blur-md">
      <PageContainer className="py-4">
        <div className="flex items-center justify-between gap-6">
          <NavLink className="flex items-center gap-3" to="/">
            <div className="flex flex-col justify-center">
              <p className="text-base font-semibold uppercase tracking-[0.22em] text-ink sm:text-lg dark:text-slate-50">SeasonScout</p>
              <p className="text-sm text-ink/70 dark:text-slate-300/80">Travel climate planner</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 md:flex">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/70 dark:hover:bg-white/10',
                    isActive
                      ? 'bg-white text-ink shadow-sm dark:bg-white/8 dark:text-slate-100'
                      : 'text-ink/70 dark:text-slate-300/80',
                  )
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <button
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-ink/72 transition hover:-translate-y-0.5 hover:bg-white/75 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12"
              onClick={toggleTheme}
              type="button"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>
            {isLoading ? (
              <span className="rounded-full bg-white/65 px-4 py-2 text-sm font-medium text-ink/60 dark:border dark:border-slate-800 dark:bg-white/[0.04] dark:text-slate-300/80">Checking session</span>
            ) : session ? (
              <>
                <span className="rounded-full bg-white/65 px-4 py-2 text-sm font-medium text-ink/65 dark:border dark:border-slate-800 dark:bg-white/[0.04] dark:text-slate-200">
                  {accountLabel}
                </span>
                <Button onClick={handleSignOut} size="sm" variant="secondary">
                  Sign out
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
          <button
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/55 text-ink/72 transition hover:bg-white/75 dark:bg-white/8 dark:text-slate-200 dark:hover:bg-white/12"
            onClick={toggleTheme}
            type="button"
          >
            {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/70 dark:hover:bg-white/10',
                  isActive
                    ? 'bg-white text-ink shadow-sm dark:bg-white/8 dark:text-slate-100'
                    : 'bg-white/55 text-ink/70 dark:bg-white/[0.04] dark:text-slate-300/80',
                )
              }
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}

          {session ? (
            <Button onClick={handleSignOut} size="sm" variant="secondary">
              Sign out
            </Button>
          ) : null}
        </nav>
      </PageContainer>
    </header>
  );
}
