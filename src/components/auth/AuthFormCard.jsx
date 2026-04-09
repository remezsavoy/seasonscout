import { Button } from '../ui/Button';
import { StatusPanel } from '../ui/StatusPanel';

const modeCopy = {
  signIn: {
    eyebrow: 'Sign in',
    title: 'Return to your saved climate plans',
    submitLabel: 'Sign in',
  },
  signUp: {
    eyebrow: 'Create account',
    title: 'Start saving destinations for later',
    submitLabel: 'Create account',
  },
};

export function AuthFormCard({
  mode,
  values,
  onChange,
  onModeChange,
  onSubmit,
  isSubmitting,
  errorMessage,
  statusMessage,
  isConfigured,
}) {
  const copy = modeCopy[mode];

  return (
    <section className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
      <div className="flex flex-wrap gap-3">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'signIn' ? 'bg-ink text-white shadow-sm' : 'bg-ink/5 text-ink/65 hover:bg-ink/10'
          }`}
          onClick={() => onModeChange('signIn')}
          type="button"
        >
          Sign in
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            mode === 'signUp' ? 'bg-ink text-white shadow-sm' : 'bg-ink/5 text-ink/65 hover:bg-ink/10'
          }`}
          onClick={() => onModeChange('signUp')}
          type="button"
        >
          Sign up
        </button>
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">{copy.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">{copy.title}</h2>
      </div>

      {!isConfigured ? (
        <StatusPanel
          className="mt-6"
          title="Supabase Auth is not configured"
          description="Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before using email/password authentication."
          tone="error"
        />
      ) : null}

      {errorMessage ? (
        <StatusPanel className="mt-6" title="Authentication failed" description={errorMessage} tone="error" />
      ) : null}

      {statusMessage ? (
        <StatusPanel className="mt-6" title="Authentication update" description={statusMessage} tone="success" />
      ) : null}

      <form className="mt-6 space-y-5" onSubmit={onSubmit}>
        {mode === 'signUp' ? (
          <div>
            <label className="text-sm font-medium text-ink/80" htmlFor="display-name">
              Display name
            </label>
            <input
              id="display-name"
              className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
              name="displayName"
              onChange={onChange}
              placeholder="SeasonScout traveler"
              value={values.displayName}
            />
          </div>
        ) : null}

        <div>
          <label className="text-sm font-medium text-ink/80" htmlFor="auth-email">
            Email
          </label>
          <input
            autoComplete="email"
            id="auth-email"
            className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
            name="email"
            onChange={onChange}
            placeholder="traveler@example.com"
            type="email"
            value={values.email}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink/80" htmlFor="auth-password">
            Password
          </label>
          <input
            autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
            id="auth-password"
            className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
            name="password"
            onChange={onChange}
            placeholder="At least 6 characters"
            type="password"
            value={values.password}
          />
        </div>

        <Button className="w-full" disabled={isSubmitting || !isConfigured} size="lg" type="submit">
          {isSubmitting ? 'Submitting...' : copy.submitLabel}
        </Button>
      </form>
    </section>
  );
}
