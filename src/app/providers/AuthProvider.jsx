import { createContext, startTransition, useContext, useEffect, useState } from 'react';
import { authService } from '../../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    function applyState(nextSession, nextError = null) {
      startTransition(() => {
        setSession(nextSession);
        setError(nextError);
        setIsLoading(false);
      });
    }

    authService
      .getSession()
      .then((restoredSession) => {
        if (!isMounted) {
          return;
        }

        applyState(restoredSession, null);
      })
      .catch((sessionError) => {
        if (!isMounted) {
          return;
        }

        applyState(null, sessionError);
      });

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      applyState(nextSession, null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(credentials) {
    const data = await authService.signIn(credentials);

    if (data?.session !== undefined) {
      startTransition(() => {
        setSession(data.session);
        setError(null);
      });
    }

    return data;
  }

  async function signUp(credentials) {
    const data = await authService.signUp(credentials);

    if (data?.session !== undefined) {
      startTransition(() => {
        setSession(data.session);
        setError(null);
      });
    }

    return data;
  }

  async function signOut() {
    await authService.signOut();

    startTransition(() => {
      setSession(null);
      setError(null);
    });
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        isLoading,
        error,
        isConfigured: authService.isConfigured(),
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider.');
  }

  return context;
}
