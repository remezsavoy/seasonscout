import { useEffect, useState } from 'react';
import { favoritesService } from '../services/favoritesService';
import { useAuth } from './useAuth';

const initialState = {
  isFavorited: false,
  isLoading: false,
  isSaving: false,
  error: null,
};

export function useFavoriteDestination(destinationId) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const userId = user?.id ?? '';
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let isMounted = true;

    if (!destinationId || !userId) {
      setState(initialState);

      return () => {
        isMounted = false;
      };
    }

    setState((currentState) => ({
      ...currentState,
      isFavorited: false,
      isLoading: true,
      error: null,
    }));

    favoritesService
      .getFavoriteStatus({ userId, destinationId })
      .then((isFavorited) => {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          isFavorited,
          isLoading: false,
        }));
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setState((currentState) => ({
          ...currentState,
          error,
          isLoading: false,
        }));
      });

    return () => {
      isMounted = false;
    };
  }, [destinationId, userId]);

  async function saveFavorite() {
    if (!destinationId) {
      return null;
    }

    setState((currentState) => ({
      ...currentState,
      isSaving: true,
      error: null,
    }));

    try {
      const result = await favoritesService.saveFavorite({ userId, destinationId });

      setState((currentState) => ({
        ...currentState,
        isFavorited: result.isFavorited,
        isSaving: false,
        error: null,
      }));

      return result;
    } catch (error) {
      setState((currentState) => ({
        ...currentState,
        isSaving: false,
        error,
      }));

      throw error;
    }
  }

  return {
    ...state,
    isAuthLoading,
    isSignedIn: Boolean(userId),
    saveFavorite,
  };
}
