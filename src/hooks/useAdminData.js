import { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';

function groupDestinationsByCountry(destinations) {
  return destinations.reduce((grouped, destination) => {
    const currentDestinations = grouped[destination.country_code] ?? [];
    currentDestinations.push(destination);
    grouped[destination.country_code] = currentDestinations;
    return grouped;
  }, {});
}

function sortCountries(countries) {
  return [...countries].sort((leftCountry, rightCountry) => {
    const leftTimestamp = leftCountry.last_enriched_at ? new Date(leftCountry.last_enriched_at).getTime() : -Infinity;
    const rightTimestamp = rightCountry.last_enriched_at ? new Date(rightCountry.last_enriched_at).getTime() : -Infinity;

    if (leftTimestamp !== rightTimestamp) {
      return rightTimestamp - leftTimestamp;
    }

    return (leftCountry.name ?? '').localeCompare(rightCountry.name ?? '', 'en', { sensitivity: 'base' });
  });
}

function sortDestinations(destinations) {
  return [...destinations].sort((leftDestination, rightDestination) =>
    (leftDestination.name ?? '').localeCompare(rightDestination.name ?? '', 'en', { sensitivity: 'base' }));
}

export function useAdminData(enabled = true) {
  const [state, setState] = useState({
    countries: [],
    destinationsByCountryCode: {},
    error: null,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      setState({
        countries: [],
        destinationsByCountryCode: {},
        error: null,
        isLoading: false,
      });
      return undefined;
    }

    let isMounted = true;

    async function loadAdminData() {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));

      try {
        const [countries, destinations] = await Promise.all([
          adminService.getCountries(),
          adminService.getDestinations(),
        ]);

        if (!isMounted) {
          return;
        }

        setState({
          countries,
          destinationsByCountryCode: groupDestinationsByCountry(destinations),
          error: null,
          isLoading: false,
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setState({
          countries: [],
          destinationsByCountryCode: {},
          error,
          isLoading: false,
        });
      }
    }

    loadAdminData();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  async function refresh(options = {}) {
    const { silently = false } = options;

    if (!enabled) {
      return;
    }

    if (!silently) {
      setState((currentState) => ({
        ...currentState,
        error: null,
        isLoading: true,
      }));
    }

    try {
      const [countries, destinations] = await Promise.all([
        adminService.getCountries(),
        adminService.getDestinations(),
      ]);

      setState({
        countries,
        destinationsByCountryCode: groupDestinationsByCountry(destinations),
        error: null,
        isLoading: false,
      });
    } catch (error) {
      setState((currentState) => ({
        countries: silently ? currentState.countries : [],
        destinationsByCountryCode: silently ? currentState.destinationsByCountryCode : {},
        error,
        isLoading: false,
      }));
    }
  }

  function removeDestination(countryCode, destinationId, isPublished) {
    setState((currentState) => {
      const currentDestinations = currentState.destinationsByCountryCode[countryCode] ?? [];
      const nextDestinations = currentDestinations.filter((destination) => destination.id !== destinationId);

      return {
        ...currentState,
        destinationsByCountryCode: {
          ...currentState.destinationsByCountryCode,
          [countryCode]: nextDestinations,
        },
        countries: currentState.countries.map((country) => {
          if (country.code !== countryCode) {
            return country;
          }

          return {
            ...country,
            destination_count: Math.max((country.destination_count ?? currentDestinations.length) - 1, 0),
            published_destination_count: isPublished
              ? Math.max((country.published_destination_count ?? 0) - 1, 0)
              : country.published_destination_count,
          };
        }),
      };
    });
  }

  function removeCountry(countryCode) {
    setState((currentState) => {
      const nextDestinationsByCountryCode = { ...currentState.destinationsByCountryCode };
      delete nextDestinationsByCountryCode[countryCode];

      return {
        ...currentState,
        countries: currentState.countries.filter((country) => country.code !== countryCode),
        destinationsByCountryCode: nextDestinationsByCountryCode,
      };
    });
  }

  function applyDestinationMutation(countryCode, destinationId, mutationResult) {
    if (!countryCode || !destinationId) {
      return;
    }

    setState((currentState) => {
      const currentDestinations = currentState.destinationsByCountryCode[countryCode] ?? [];
      const updatedAt = new Date().toISOString();
      const nextDestinations = currentDestinations.map((destination) => {
        if (destination.id !== destinationId) {
          return destination;
        }

        const mutatedDestination = mutationResult?.destinations?.[0];
        const mutationStatus = mutatedDestination?.status?.toLowerCase?.();
        const nextEnrichmentStatus = mutationStatus === 'failed'
          ? 'failed'
          : destination.enrichment_status && destination.enrichment_status !== 'failed'
            ? destination.enrichment_status
            : 'enriched';

        return {
          ...destination,
          slug: mutatedDestination?.slug ?? destination.slug,
          name: mutatedDestination?.name ?? destination.name,
          hero_image_url: mutatedDestination?.hero_image_url ?? destination.hero_image_url,
          best_months: Array.isArray(mutatedDestination?.best_months)
            ? mutatedDestination.best_months
            : destination.best_months,
          climate_import_status: mutatedDestination?.climate_status ?? destination.climate_import_status,
          is_published: mutationStatus ? mutationStatus === 'published' : destination.is_published,
          enrichment_status: nextEnrichmentStatus,
          updated_at: updatedAt,
        };
      });

      const nextCountries = currentState.countries.map((country) => {
        if (country.code !== countryCode) {
          return country;
        }

        const publishedDestinationCount = nextDestinations.filter((destination) => destination.is_published).length;

        return {
          ...country,
          published_destination_count: publishedDestinationCount,
          last_enriched_at: updatedAt,
        };
      });

      return {
        ...currentState,
        countries: sortCountries(nextCountries),
        destinationsByCountryCode: {
          ...currentState.destinationsByCountryCode,
          [countryCode]: sortDestinations(nextDestinations),
        },
      };
    });
  }

  function applyCountryMutation(previousCountryCode, mutationResult) {
    const nextCountry = mutationResult?.country;
    const nextCountryCode = nextCountry?.code ?? previousCountryCode;

    if (!nextCountryCode) {
      return;
    }

    setState((currentState) => {
      const currentCountry = currentState.countries.find((country) => country.code === previousCountryCode);
      const currentDestinations = currentState.destinationsByCountryCode[previousCountryCode] ?? [];
      const mutatedDestinations = mutationResult?.destinations ?? [];
      const hasDestinationMutation = mutatedDestinations.length > 0;
      const existingDestinationsBySlug = new Map(currentDestinations.map((destination) => [destination.slug, destination]));
      const updatedAt = new Date().toISOString();
      const nextDestinations = hasDestinationMutation
        ? sortDestinations(mutatedDestinations.map((destination) => {
          const existingDestination = existingDestinationsBySlug.get(destination.slug);
          const mutationStatus = destination.status?.toLowerCase?.();
          const nextEnrichmentStatus = mutationStatus === 'failed'
            ? 'failed'
            : existingDestination?.enrichment_status && existingDestination.enrichment_status !== 'failed'
              ? existingDestination.enrichment_status
              : 'enriched';

          return {
            ...existingDestination,
            slug: destination.slug ?? existingDestination?.slug ?? '',
            name: destination.name ?? existingDestination?.name ?? '',
            country: nextCountry?.name ?? currentCountry?.name ?? existingDestination?.country ?? '',
            country_code: nextCountryCode,
            hero_image_url: destination.hero_image_url ?? existingDestination?.hero_image_url ?? null,
            best_months: Array.isArray(destination.best_months)
              ? destination.best_months
              : existingDestination?.best_months ?? [],
            travel_tags: existingDestination?.travel_tags ?? [],
            enrichment_status: nextEnrichmentStatus,
            climate_import_status: destination.climate_status ?? existingDestination?.climate_import_status ?? 'pending',
            is_published: mutationStatus === 'published',
            comfort_score: existingDestination?.comfort_score ?? null,
            updated_at: updatedAt,
          };
        }))
        : currentDestinations;

      const publishedDestinationCount = nextDestinations.filter((destination) => destination.is_published).length;
      const mergedCountry = {
        ...currentCountry,
        ...nextCountry,
        code: nextCountryCode,
        name: nextCountry?.name ?? currentCountry?.name ?? '',
        status: nextCountry?.is_published
          ? 'published'
          : currentCountry?.status && currentCountry.status !== 'failed'
            ? currentCountry.status
            : 'draft',
        destination_count: hasDestinationMutation
          ? mutationResult?.stats?.destinations_created ?? nextDestinations.length
          : currentCountry?.destination_count ?? nextDestinations.length,
        published_destination_count: hasDestinationMutation
          ? mutationResult?.stats?.destinations_published ?? publishedDestinationCount
          : currentCountry?.published_destination_count ?? publishedDestinationCount,
        last_enriched_at: updatedAt,
      };

      const nextCountries = sortCountries([
        ...currentState.countries.filter((country) => country.code !== previousCountryCode && country.code !== nextCountryCode),
        mergedCountry,
      ]);
      const nextDestinationsByCountryCode = { ...currentState.destinationsByCountryCode };

      if (previousCountryCode && previousCountryCode !== nextCountryCode) {
        delete nextDestinationsByCountryCode[previousCountryCode];
      }

      nextDestinationsByCountryCode[nextCountryCode] = nextDestinations;

      return {
        ...currentState,
        countries: nextCountries,
        destinationsByCountryCode: nextDestinationsByCountryCode,
      };
    });
  }

  function updateCountryHeroImage(countryCode, imageRecord) {
    if (!countryCode || !imageRecord) {
      return;
    }

    setState((currentState) => ({
      ...currentState,
      countries: currentState.countries.map((country) => {
        if (country.code !== countryCode) {
          return country;
        }

        return {
          ...country,
          hero_image_url: imageRecord.hero_image_url ?? country.hero_image_url,
          hero_image_source_name: imageRecord.hero_image_source_name ?? country.hero_image_source_name ?? null,
          hero_image_source_url: imageRecord.hero_image_source_url ?? country.hero_image_source_url ?? null,
          hero_image_attribution_name:
            imageRecord.hero_image_attribution_name ?? country.hero_image_attribution_name ?? null,
          hero_image_attribution_url:
            imageRecord.hero_image_attribution_url ?? country.hero_image_attribution_url ?? null,
          updated_at: imageRecord.updated_at ?? country.updated_at,
        };
      }),
    }));
  }

  function updateDestinationHeroImage(countryCode, destinationId, imageRecord) {
    if (!countryCode || !destinationId || !imageRecord) {
      return;
    }

    setState((currentState) => {
      const currentDestinations = currentState.destinationsByCountryCode[countryCode] ?? [];

      return {
        ...currentState,
        destinationsByCountryCode: {
          ...currentState.destinationsByCountryCode,
          [countryCode]: currentDestinations.map((destination) => {
            if (destination.id !== destinationId) {
              return destination;
            }

            return {
              ...destination,
              hero_image_url: imageRecord.hero_image_url ?? destination.hero_image_url,
              hero_image_source_name: imageRecord.hero_image_source_name ?? destination.hero_image_source_name ?? null,
              hero_image_source_url: imageRecord.hero_image_source_url ?? destination.hero_image_source_url ?? null,
              hero_image_attribution_name:
                imageRecord.hero_image_attribution_name ?? destination.hero_image_attribution_name ?? null,
              hero_image_attribution_url:
                imageRecord.hero_image_attribution_url ?? destination.hero_image_attribution_url ?? null,
              updated_at: imageRecord.updated_at ?? destination.updated_at,
            };
          }),
        },
      };
    });
  }

  return {
    ...state,
    applyCountryMutation,
    applyDestinationMutation,
    removeCountry,
    removeDestination,
    refresh,
    updateCountryHeroImage,
    updateDestinationHeroImage,
  };
}
