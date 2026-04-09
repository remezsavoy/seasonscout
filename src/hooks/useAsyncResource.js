import { useEffect, useState } from 'react';

export function useAsyncResource(loader, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    error: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    setState((currentState) => ({
      data: currentState.data,
      error: null,
      isLoading: true,
    }));

    loader()
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setState({
          data,
          error: null,
          isLoading: false,
        });
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setState({
          data: null,
          error,
          isLoading: false,
        });
      });

    return () => {
      isMounted = false;
    };
  }, dependencies);

  return state;
}
