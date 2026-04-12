export type CountryQuickFacts = {
  capital: string;
  languages: string[];
  timezones: string[];
  currency: {
    code: string;
    name: string;
    symbol: string;
  };
  driving_side: string;
  idd: string;
  borders: string[];
  flag_url: string;
};

export type Database = {
  public: {
    Tables: {
      countries: {
        Row: {
          code: string;
          slug: string;
          name: string;
          continent: string | null;
          summary: string | null;
          summary_metadata: Record<string, unknown> | null;
          hero_image_url: string | null;
          hero_image_source_name: string | null;
          hero_image_source_url: string | null;
          hero_image_attribution_name: string | null;
          hero_image_attribution_url: string | null;
          seasonal_overview: string | null;
          enrichment_status: string | null;
          enrichment_metadata: Record<string, unknown> | null;
          last_enriched_at: string | null;
          is_published: boolean | null;
          quick_facts: CountryQuickFacts | Record<string, never>;
        };
      };
    };
  };
};
