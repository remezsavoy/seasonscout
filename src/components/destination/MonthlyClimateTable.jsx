import { EmptyState } from '../ui/EmptyState';
import { SectionHeading } from '../ui/SectionHeading';

const recommendationClasses = {
  Ideal: 'bg-lagoon/10 text-lagoon',
  Good: 'bg-ink/8 text-ink',
  Okay: 'bg-sunrise/30 text-ink',
  Avoid: 'bg-coral/15 text-coral',
  Pending: 'bg-ink/8 text-ink',
};

export function MonthlyClimateTable({ rows, climateSource }) {
  return (
    <section className="space-y-8">
      <SectionHeading
        eyebrow="Monthly climate"
        title="Averages across the full year"
      />

      <div className="rounded-[1.75rem] border border-ink/10 bg-white/80 p-4 shadow-soft sm:p-6">
        {rows.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-ink/45">
                    <th className="px-3 pb-2 font-semibold">Month</th>
                    <th className="px-3 pb-2 font-semibold">High</th>
                    <th className="px-3 pb-2 font-semibold">Low</th>
                    <th className="px-3 pb-2 font-semibold">Rain</th>
                    <th className="px-3 pb-2 font-semibold">Humidity</th>
                    <th className="px-3 pb-2 font-semibold">Sun</th>
                    <th className="px-3 pb-2 font-semibold">Comfort</th>
                    <th className="px-3 pb-2 font-semibold">Recommendation</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="rounded-[1rem] bg-sand/45 text-sm text-ink/78">
                      <td className="rounded-l-[1rem] px-3 py-4 font-semibold text-ink">{row.month}</td>
                      <td className="px-3 py-4">{row.avgHigh}</td>
                      <td className="px-3 py-4">{row.avgLow}</td>
                      <td className="px-3 py-4">{row.precipitation}</td>
                      <td className="px-3 py-4">{row.humidity}</td>
                      <td className="px-3 py-4">{row.sunshine}</td>
                      <td className="px-3 py-4">{row.comfortScore}</td>
                      <td className="rounded-r-[1rem] px-3 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            recommendationClasses[row.recommendation] || recommendationClasses.Pending
                          }`}
                        >
                          {row.recommendation}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-5 text-sm leading-7 text-ink/60">Climate source: {climateSource}</p>
          </>
        ) : (
          <EmptyState
            title="Monthly climate data is not available yet"
            description="Once stored climate rows are available for this destination, the full 12-month view will render here."
          />
        )}
      </div>
    </section>
  );
}
