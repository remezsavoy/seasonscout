import { useEffect, useState } from 'react';
import { CalendarDays, Heart } from 'lucide-react';
import { AuthFormCard } from '../components/auth/AuthFormCard';
import { AuthSessionCard } from '../components/auth/AuthSessionCard';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { StatusPanel } from '../components/ui/StatusPanel';
import { ToastNotice } from '../components/ui/ToastNotice';
import { useAuth } from '../hooks/useAuth';

const initialFormValues = {
  displayName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export function AuthPage() {
  const {
    session,
    isLoading,
    error,
    isConfigured,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    updateProfile,
  } = useAuth();
  const [mode, setMode] = useState('signIn');
  const [values, setValues] = useState(initialFormValues);
  const [submitError, setSubmitError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [hadSession, setHadSession] = useState(Boolean(session));

  useEffect(() => {
    setDisplayName(session?.user?.user_metadata?.display_name ?? '');
  }, [session?.user?.user_metadata?.display_name]);

  useEffect(() => {
    if (!profileMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setProfileMessage('');
    }, 3200);

    return () => window.clearTimeout(timeoutId);
  }, [profileMessage]);

  useEffect(() => {
    if (!session && hadSession) {
      setMode('signIn');
      setValues(initialFormValues);
      setSubmitError('');
      setStatusMessage('');
      setProfileError('');
      setProfileMessage('');
    }

    setHadSession(Boolean(session));
  }, [hadSession, session]);

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setSubmitError('');
    setStatusMessage('');
    if (nextMode !== 'signUp') {
      setValues((currentValues) => ({
        ...currentValues,
        displayName: '',
        confirmPassword: '',
      }));
    }
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

    if (!values.email.trim()) {
      setSubmitError('Email is required.');
      return;
    }

    if (mode !== 'resetPassword' && !values.password.trim()) {
      setSubmitError('Email and password are required.');
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
      } else if (mode === 'resetPassword') {
        await sendPasswordResetEmail(values.email.trim());
        setStatusMessage('Check your email for the reset link.');
        setMode('signIn');
      } else {
        if (!values.displayName.trim()) {
          setSubmitError('Display name is required.');
          return;
        }

        if (values.password.trim().length < 6) {
          setSubmitError('Use a password with at least 6 characters.');
          return;
        }

        if (values.password !== values.confirmPassword) {
          setSubmitError('Passwords do not match.');
          return;
        }

        const result = await signUp({
          email: values.email.trim(),
          password: values.password,
          displayName: values.displayName.trim(),
        });

        if (result?.user?.identities?.length === 0) {
          setSubmitError('This email is already registered. Please sign in or reset your password.');
          return;
        }

        if (!result.session) {
          setStatusMessage('Account created. Check your email if confirmation is enabled.');
        }
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

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setProfileError('');
    setProfileMessage('');

    const trimmedDisplayName = displayName.trim();

    if (!session) {
      setProfileError('You need to be signed in to update your profile.');
      return;
    }

    if (!trimmedDisplayName) {
      setProfileError('Display name is required.');
      return;
    }

    setIsSavingProfile(true);

    try {
      await updateProfile({ displayName: trimmedDisplayName });
      setProfileMessage('Profile updated successfully.');
    } catch (profileUpdateError) {
      setProfileError(profileUpdateError.message || 'Unable to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  }

  return (
    <PageContainer className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lagoon">
          {session ? 'Profile settings' : 'Authentication'}
        </p>
        <h1 className="mt-4 font-display text-5xl text-ink sm:text-6xl">
          {session ? 'Manage your account details and traveler profile.' : 'Sign in to save destinations and travel plans.'}
        </h1>
        <p className="mt-5 text-base leading-8 text-ink/72">
          {session
            ? 'Update the name shown across your account and keep your saved destinations connected to the right profile.'
            : 'Create an account or sign back in to keep your favorite destinations available across sessions.'}
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
              onForgotPassword={() => handleModeChange('resetPassword')}
              onModeChange={handleModeChange}
              onSubmit={handleSubmit}
              statusMessage={statusMessage}
              values={values}
            />
          )}

          <article className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
            {session ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Profile settings</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Update your display name</h2>
                <p className="mt-4 text-sm leading-7 text-ink/70">
                  This name appears in your account area and helps personalize the experience across the app.
                </p>

                {profileError ? (
                  <StatusPanel
                    className="mt-6"
                    title="Unable to save changes"
                    description={profileError}
                    tone="error"
                  />
                ) : null}

                <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
                  <div>
                    <label className="text-sm font-medium text-ink/80" htmlFor="profile-display-name">
                      Display name
                    </label>
                    <input
                      id="profile-display-name"
                      className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="SeasonScout traveler"
                      type="text"
                      value={displayName}
                    />
                  </div>

                  <div className="rounded-[1.25rem] border border-ink/10 bg-sand/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-ink/45">Signed in as</p>
                    <p className="mt-3 break-all text-sm font-medium text-ink">
                      {session.user.email || 'Email available after auth'}
                    </p>
                  </div>

                  <Button disabled={isSavingProfile} size="lg" type="submit">
                    {isSavingProfile ? 'Saving changes...' : 'Save Changes'}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Why sign in</p>
                <h2 className="mt-3 text-3xl font-semibold text-ink">Keep your travel shortlist within reach.</h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-ink/70">
                  A single account keeps your saved destinations and ideal travel windows ready whenever you return.
                </p>

                <div className="mt-10 space-y-8">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
                      <Heart className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-ink">Save your favorites</h3>
                      <p className="mt-2 text-sm leading-7 text-ink/72">
                        Build a shortlist of destinations tailored to your preferred climate.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 text-ink">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-ink">Plan across seasons</h3>
                      <p className="mt-2 text-sm leading-7 text-ink/72">
                        Keep your climate windows and destination ideas synced across all your devices.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </article>
        </section>
      ) : null}

      <ToastNotice message={profileMessage || statusMessage} />
    </PageContainer>
  );
}
