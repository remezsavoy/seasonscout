import { Button } from '../ui/Button';

export function AuthSessionCard({ session, onSignOut, isSigningOut }) {
  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Signed in</p>
      <h2 className="mt-3 text-3xl font-semibold text-ink">Your account is ready for favorites</h2>
      <p className="mt-4 text-sm leading-7 text-ink/70">
        {session.user.email || 'Email available after auth'} is the active Supabase Auth session for this browser.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[1.25rem] bg-ink/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">User ID</p>
          <p className="mt-3 break-all text-sm font-medium text-ink">{session.user.id}</p>
        </div>
        <div className="rounded-[1.25rem] bg-ink/5 p-4">
          <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Email confirmed</p>
          <p className="mt-3 text-sm font-medium text-ink">
            {session.user.email_confirmed_at ? 'Yes' : 'Confirmation pending'}
          </p>
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
