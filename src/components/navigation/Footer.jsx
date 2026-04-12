import { PageContainer } from '../ui/PageContainer';

export function Footer() {
  return (
    <footer className="border-t border-ink/10 py-12">
      <PageContainer className="flex flex-col gap-8 text-sm text-ink/60 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xs">
          <p className="font-display text-xl font-semibold text-ink">SeasonScout</p>
          <p className="mt-3 leading-6">Smart travel planning powered by climate data.</p>
        </div>
        <div className="flex flex-col gap-6 sm:items-end">
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <a className="transition hover:text-lagoon" href="#">About</a>
            <a className="transition hover:text-lagoon" href="#">Contact</a>
            <a className="transition hover:text-lagoon" href="#">Privacy</a>
          </div>
          <p>© 2026 SeasonScout</p>
        </div>
      </PageContainer>
    </footer>
  );
}
