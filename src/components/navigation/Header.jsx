import { NavLink } from 'react-router-dom';
import seasonscoutLogo from '../../assets/logo/seasonscout-logo.png';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/cn';
import { Button, buttonVariants } from '../ui/Button';
import { PageContainer } from '../ui/PageContainer';

export function Header() {
  const { session, isLoading, signOut } = useAuth();
  const navigationItems = [
    { label: 'Home', to: '/' },
    { label: 'Favorites', to: '/favorites' },
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
    <header className="sticky top-0 z-30 border-b border-white/40 bg-sand/75 backdrop-blur-xl">
      <PageContainer className="py-4">
        <div className="flex items-center justify-between gap-6">
          <NavLink className="flex items-center gap-3" to="/">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center">
              <img
                alt="SeasonScout logo"
                className="h-11 w-11 object-contain"
                decoding="async"
                loading="eager"
                src={seasonscoutLogo}
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">SeasonScout</p>
              <p className="text-sm text-ink/60">Travel climate planner</p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-2 md:flex">
            {navigationItems.map((item) => (
              <NavLink
                key={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/70',
                    isActive ? 'bg-white text-ink shadow-sm' : 'text-ink/70',
                  )
                }
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            {isLoading ? (
              <span className="rounded-full bg-white/65 px-4 py-2 text-sm font-medium text-ink/60">Checking session</span>
            ) : session ? (
              <>
                <span className="rounded-full bg-white/65 px-4 py-2 text-sm font-medium text-ink/65">
                  {session.user.email || 'Signed in'}
                </span>
                <Button onClick={handleSignOut} size="sm" variant="secondary">
                  Sign out
                </Button>
              </>
            ) : null}

            <NavLink className={buttonVariants({ variant: 'primary', size: 'sm' })} to="/destinations/kyoto">
              Explore sample city
            </NavLink>
          </div>
        </div>

        <nav className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
          {navigationItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition hover:bg-white/70',
                  isActive ? 'bg-white text-ink shadow-sm' : 'bg-white/55 text-ink/70',
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
