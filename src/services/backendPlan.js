export const backendPlan = {
  rpc: [
    {
      name: 'get_destination_full',
      purpose: 'Aggregate destination metadata, climate summaries, and favorite state into one response.',
    },
    {
      name: 'compute_best_months',
      purpose: 'Centralize best-month selection so ranking logic is not duplicated in the frontend.',
    },
    {
      name: 'toggle_favorite',
      purpose: 'Guarantee idempotent favorite writes and duplicate prevention at the database layer.',
    },
  ],
  edgeFunctions: [
    {
      name: 'compose-country-full',
      purpose: 'Compose a full country package server-side, including editorial generation, destination discovery, imagery, and climate import.',
    },
  ],
  frontendResponsibilities: [
    'Render prepared destination data',
    'Manage local interaction state and route params',
    'Handle loading, empty, and error states',
  ],
};
