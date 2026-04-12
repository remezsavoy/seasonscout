import { Button } from '../ui/Button';

export function AuthSessionCard({ session, onSignOut, isSigningOut }) {
  const displayName = session.user.user_metadata?.display_name?.trim() || 'Traveler';
  const authStatus = session.user.email_confirmed_at ? 'Verified email' : 'Email confirmation pending';

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Account details</p>
      <h2 className="mt-3 text-3xl font-semibold text-ink">Profile snapshot</h2>
      <p className="mt-4 text-sm leading-7 text-ink/70">
        Review the active account details tied to your saved destinations and travel planning activity.
      </p>

      <div className="mt-6 space-y-4">
        <div className="rounded-[1.25rem] border border-ink/10 bg-ink/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Display name</p>
          <p className="mt-3 text-sm font-medium text-ink">{displayName}</p>
        </div>
        <div className="rounded-[1.25rem] border border-ink/10 bg-ink/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Email</p>
          <p className="mt-3 break-all text-sm font-medium text-ink">
            {session.user.email || 'Email available after auth'}
          </p>
        </div>
        <div className="rounded-[1.25rem] border border-ink/10 bg-ink/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Auth status</p>
          <p className="mt-3 text-sm font-medium text-ink">{authStatus}</p>
        </div>
      </div>

      <div className="mt-6">
        <Button disabled={isSigningOut} onClick={onSignOut} size="lg" variant="secondary">
          {isSigningOut ? 'Signing out...' : 'Sign out'}
        </Button>
      </div>
    </section>
  );
}
