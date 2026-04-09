import { useEffect, useState } from 'react';
import { searchService } from '../services/searchService';

const initialState = {
  results: [],
  error: null,
  isLoading: false,
  hasSearched: false,
  isShortQuery: false,
};

export function useDestinationSearch(query, options = {}) {
  const minCharacters = options.minCharacters ?? 2;
  const normalizedQuery = query.trim();
  const [state, setState] = useState(initialState);

  useEffect(() => {
    let isMounted = true;

    if (!normalizedQuery) {
      setState(initialState);
      return undefined;
    }

    if (normalizedQuery.length < minCharacters) {
      setState({
        ...initialState,
        hasSearched: true,
        isShortQuery: true,
      });
      return undefined;
    }

    setState((currentState) => ({
      results: currentState.results,
      error: null,
      isLoading: true,
      hasSearched: true,
      isShortQuery: false,
    }));

    searchService
      .searchPlaces(normalizedQuery)
      .then((results) => {
        if (!isMounted) {
          return;
        }

        setState({
          results,
          error: null,
          isLoading: false,
          hasSearched: true,
          isShortQuery: false,
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setState({
          results: [],
          error,
          isLoading: false,
          hasSearched: true,
          isShortQuery: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, [minCharacters, normalizedQuery]);

  return state;
}
