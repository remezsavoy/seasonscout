import { EmptyState } from '../ui/EmptyState';
import { CountryRow } from './CountryRow';

export function CountryGrid({
  countries,
  destinationsByCountryCode,
  pendingCountryCode,
  deletingCountryCode,
  onDeleteDestination,
  onRegenerateDestination,
  onEditCountryImage,
  onEditDestinationImage,
  onRegenerateCountry,
  onDeleteCountry,
}) {
  if (!countries.length) {
    return (
      <EmptyState
        title="No countries in the catalog yet"
        description="Use the generation form above to compose the first country package and seed the admin catalog."
      />
    );
  }

  return (
    <div className="space-y-4">
      {countries.map((country) => (
        <CountryRow
          key={country.code}
          country={country}
          destinations={destinationsByCountryCode[country.code] ?? []}
          isDeleting={deletingCountryCode === country.code}
          isRegenerating={pendingCountryCode === country.code}
          onDeleteDestination={onDeleteDestination}
          onEditCountryImage={onEditCountryImage}
          onEditDestinationImage={onEditDestinationImage}
          onRegenerateDestination={onRegenerateDestination}
          onDelete={() => onDeleteCountry(country)}
          onRegenerate={() => onRegenerateCountry(country)}
        />
      ))}
    </div>
  );
}
