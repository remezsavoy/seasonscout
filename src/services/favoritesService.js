import { hasSupabaseClient, requireSupabaseClient } from '../lib/supabaseClient';
import { fetchFavoriteDestinationRows } from './destinationDataSource';
import { mapFavoriteDestination } from './destinationMappers';
import { favoritePreview } from './mockData';
import { createSupabaseServiceError } from './serviceError';

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

function requireFavoriteParams({ userId, destinationId }) {
  if (!userId) {
    throw new Error('A signed-in user is required to manage favorites.');
  }

  if (!destinationId) {
    throw new Error('A destination id is required to manage favorites.');
  }
}

async function readFavoriteRecord(supabase, { userId, destinationId }) {
  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', userId)
    .eq('destination_id', destinationId)
    .maybeSingle();

  if (error) {
    throw createSupabaseServiceError('Unable to inspect favorite state.', error);
  }

  return data;
}

async function insertFavoriteRecord(supabase, { userId, destinationId }) {
  const { error } = await supabase.from('favorites').insert({ user_id: userId, destination_id: destinationId });

  if (error?.code === '23505') {
    return;
  }

  if (error) {
    throw createSupabaseServiceError('Unable to save the favorite.', error);
  }
}

async function deleteFavoriteRecord(supabase, favoriteId) {
  const { error } = await supabase.from('favorites').delete().eq('id', favoriteId);

  if (error) {
    throw createSupabaseServiceError('Unable to remove the favorite.', error);
  }
}

export const favoritesService = {
  async listFavorites({ userId }) {
    if (!userId) {
      return withLatency([]);
    }

    if (hasSupabaseClient()) {
      const destinationRows = await fetchFavoriteDestinationRows(userId);

      return destinationRows.map(mapFavoriteDestination);
    }

    return withLatency(favoritePreview.map(mapFavoriteDestination));
  },

  async getFavoriteStatus({ userId, destinationId }) {
    if (!userId || !destinationId) {
      return false;
    }

    if (!hasSupabaseClient()) {
      return false;
    }

    const supabase = requireSupabaseClient();
    const existingFavorite = await readFavoriteRecord(supabase, { userId, destinationId });

    return Boolean(existingFavorite);
  },

  async saveFavorite({ userId, destinationId }) {
    requireFavoriteParams({ userId, destinationId });

    if (!hasSupabaseClient()) {
      return {
        destinationId,
        isFavorited: true,
      };
    }

    const supabase = requireSupabaseClient();
    const existingFavorite = await readFavoriteRecord(supabase, { userId, destinationId });

    if (existingFavorite) {
      return {
        destinationId,
        isFavorited: true,
      };
    }

    await insertFavoriteRecord(supabase, { userId, destinationId });

    return {
      destinationId,
      isFavorited: true,
    };
  },

  async removeFavorite({ userId, destinationId }) {
    requireFavoriteParams({ userId, destinationId });

    if (!hasSupabaseClient()) {
      return {
        destinationId,
        isFavorited: false,
      };
    }

    const supabase = requireSupabaseClient();
    const existingFavorite = await readFavoriteRecord(supabase, { userId, destinationId });

    if (!existingFavorite) {
      return {
        destinationId,
        isFavorited: false,
      };
    }

    await deleteFavoriteRecord(supabase, existingFavorite.id);

    return {
      destinationId,
      isFavorited: false,
    };
  },

  async toggleFavorite({ userId, destinationId }) {
    requireFavoriteParams({ userId, destinationId });

    if (!hasSupabaseClient()) {
      return {
        destinationId,
        isFavorited: false,
      };
    }

    const supabase = requireSupabaseClient();
    const existingFavorite = await readFavoriteRecord(supabase, { userId, destinationId });

    if (existingFavorite) {
      await deleteFavoriteRecord(supabase, existingFavorite.id);

      return {
        destinationId,
        isFavorited: false,
      };
    }

    await insertFavoriteRecord(supabase, { userId, destinationId });

    return {
      destinationId,
      isFavorited: true,
    };
  },
};
