import { useEffect, useState } from 'react';
import { favoritesService } from '../services/favoritesService';
import { useAsyncResource } from './useAsyncResource';
import { useAuth } from './useAuth';

export function useFavoritesList() {
  const { session, isLoading: isAuthLoading, error: authError } = useAuth();
  const userId = session?.user?.id ?? '';
  const {
    data,
    error: favoritesError,
    isLoading: isFavoritesLoading,
  } = useAsyncResource(() => favoritesService.listFavorites({ userId }), [userId]);
  const [favorites, setFavorites] = useState([]);
  const [actionError, setActionError] = useState(null);
  const [removingIds, setRemovingIds] = useState([]);

  useEffect(() => {
    setFavorites([]);
    setActionError(null);
    setRemovingIds([]);
  }, [userId]);

  useEffect(() => {
    setFavorites(data ?? []);
  }, [data]);

  async function removeFavorite(destinationId) {
    if (!userId || !destinationId) {
      return;
    }

    setActionError(null);
    setRemovingIds((currentIds) =>
      currentIds.includes(destinationId) ? currentIds : [...currentIds, destinationId],
    );

    try {
      await favoritesService.removeFavorite({ userId, destinationId });

      setFavorites((currentFavorites) =>
        currentFavorites.filter((destination) => destination.id !== destinationId),
      );
    } catch (error) {
      setActionError(error);
      throw error;
    } finally {
      setRemovingIds((currentIds) => currentIds.filter((currentId) => currentId !== destinationId));
    }
  }

  return {
    session,
    isAuthLoading,
    authError,
    favorites,
    favoritesError,
    actionError,
    isFavoritesLoading: Boolean(userId) && isFavoritesLoading,
    removeFavorite,
    isRemovingFavorite(destinationId) {
      return removingIds.includes(destinationId);
    },
  };
}
