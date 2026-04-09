import { PageContainer } from '../ui/PageContainer';

export function Footer() {
  return (
    <footer className="border-t border-ink/10 py-10">
      <PageContainer className="flex flex-col gap-4 text-sm text-ink/60 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-ink">SeasonScout</p>
          <p className="mt-1">Thin frontend, climate intelligence prepared for backend execution.</p>
        </div>
        <div className="flex flex-wrap gap-5">
          <span>React + Vite</span>
          <span>Tailwind CSS</span>
          <span>Supabase-ready services</span>
        </div>
      </PageContainer>
    </footer>
  );
}
