import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PageContainer } from '../components/ui/PageContainer';
import { StatusPanel } from '../components/ui/StatusPanel';
import { ToastNotice } from '../components/ui/ToastNotice';
import { useAuth } from '../hooks/useAuth';

export function UpdatePasswordPage() {
  const navigate = useNavigate();
  const { isConfigured, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/');
    }, 1400);

    return () => window.clearTimeout(timeoutId);
  }, [navigate, successMessage]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.trim().length < 6) {
      setErrorMessage('Use a password with at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);
      setSuccessMessage('Password updated successfully. Redirecting you home.');
      setPassword('');
      setConfirmPassword('');
    } catch (updateError) {
      setErrorMessage(updateError.message || 'Unable to update your password right now.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PageContainer className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lagoon">Update password</p>
        <h1 className="mt-4 font-display text-5xl text-ink sm:text-6xl">
          Choose a new password for your account.
        </h1>
        <p className="mt-5 text-base leading-8 text-ink/72">
          Enter a new password below to finish the secure reset flow from your email link.
        </p>
      </div>

      {!isConfigured ? (
        <StatusPanel
          title="Supabase Auth is not configured"
          description="Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before using password reset."
          tone="error"
        />
      ) : null}

      <section className="max-w-2xl rounded-[1.75rem] border border-ink/10 bg-white/80 p-6 shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-lagoon">Secure reset</p>
        <h2 className="mt-3 text-3xl font-semibold text-ink">Set your new password</h2>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-ink/80" htmlFor="new-password">
              New Password
            </label>
            <input
              autoComplete="new-password"
              id="new-password"
              className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              type="password"
              value={password}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink/80" htmlFor="confirm-new-password">
              Confirm New Password
            </label>
            <input
              autoComplete="new-password"
              id="confirm-new-password"
              className="mt-2 w-full rounded-[1.1rem] border border-ink/10 bg-white px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-lagoon/30 focus:ring-2 focus:ring-lagoon/15"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your new password"
              type="password"
              value={confirmPassword}
            />
          </div>

          <div className="min-h-[1.25rem]">
            {errorMessage ? <p className="text-sm text-coral">{errorMessage}</p> : null}
          </div>

          <Button className="w-full" disabled={isSubmitting || !isConfigured} size="lg" type="submit">
            {isSubmitting ? 'Updating password...' : 'Update Password'}
          </Button>
        </form>
      </section>

      <ToastNotice message={successMessage} />
    </PageContainer>
  );
}
