import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthSessionCard } from '../components/auth/AuthSessionCard';
import { buttonVariants } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { StatusPanel } from '../components/ui/StatusPanel';
import { useAuth } from '../hooks/useAuth';

const initialFormValues = {
  displayName: '',
  email: '',
  password: '',
};

export function AuthPage() {
  const { session, isLoading, error, isConfigured, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState('signIn');
  const [values, setValues] = useState(initialFormValues);
  const [submitError, setSubmitError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setSubmitError('');
    setStatusMessage('');
  }

  function handleFieldChange(event) {
    const { name, value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError('');
    setStatusMessage('');

    if (!values.email.trim() || !values.password.trim()) {
      setSubmitError('Email and password are required.');
      return;
    }

    if (mode === 'signUp' && values.password.trim().length < 6) {
      setSubmitError('Use a password with at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'signIn') {
        await signIn({
          email: values.email.trim(),
          password: values.password,
        });
        setStatusMessage('Signed in successfully.');
      } else {
        const result = await signUp({
          email: values.email.trim(),
          password: values.password,
          displayName: values.displayName.trim(),
        });

        setStatusMessage(
          result.session
            ? 'Account created and signed in.'
            : 'Account created. Check your email if confirmation is enabled.',
        );
      }

      setValues(initialFormValues);
    } catch (submitAuthError) {
      setSubmitError(submitAuthError.message || 'Authentication failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setSubmitError('');
    setStatusMessage('');
    setIsSigningOut(true);

    try {
      await signOut();
    } catch (signOutError) {
      setSubmitError(signOutError.message || 'Unable to sign out.');
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <PageContainer className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lagoon">Authentication</p>
        <h1 className="mt-4 font-display text-5xl text-ink sm:text-6xl">
          Supabase Auth keeps favorites tied to a real user session.
        </h1>
        <p className="mt-5 text-base leading-8 text-ink/72">
          Session restore and auth state changes now live in a shared provider, so routes only react to the current
          session instead of managing Supabase listeners themselves.
        </p>
      </div>

      {isLoading ? (
        <StatusPanel
          title="Restoring auth session"
          description="Checking for an existing Supabase Auth session before rendering protected flows."
        />
      ) : null}

      {error ? (
        <StatusPanel
          title="Auth session restore failed"
          description={error.message || 'The current auth session could not be restored.'}
          tone="error"
        />
      ) : null}

      {!isLoading ? (
        <section className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          {session ? (
            <AuthSessionCard isSigningOut={isSigningOut} onSignOut={handleSignOut} session={session} />
          ) : (
            <AuthFormCard
              errorMessage={submitError}
              isConfigured={isConfigured}
              isSubmitting={isSubmitting}
              mode={mode}
              onChange={handleFieldChange}
              onModeChange={handleModeChange}
              onSubmit={handleSubmit}
              statusMessage={statusMessage}
              values={values}
            />
          )}

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Auth boundary</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink">Thin frontend, shared session state.</h2>

            <div className="mt-6 grid gap-4">
              <div className="rounded-[1.25rem] bg-sand/60 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Provider</p>
                <p className="mt-3 text-sm leading-7 text-ink/72">Supabase Auth with session persistence enabled in the shared client.</p>
              </div>
              <div className="rounded-[1.25rem] bg-sand/60 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Protected behavior</p>
                <p className="mt-3 text-sm leading-7 text-ink/72">Favorites can now react to the shared auth session instead of restoring auth on every route mount.</p>
              </div>
              <div className="rounded-[1.25rem] bg-sand/60 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Current environment</p>
                <p className="mt-3 text-sm leading-7 text-ink/72">
                  {isConfigured
                    ? 'Supabase environment keys are available, so email/password auth can run in this client.'
                    : 'Supabase environment keys are missing, so the auth UI stays visible but submission is disabled.'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Link className={buttonVariants({ variant: 'secondary', size: 'md' })} to="/favorites">
                Review favorites behavior
              </Link>
            </div>
          </article>
        </section>
      ) : null}
    </PageContainer>
  );
}
