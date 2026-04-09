import { createClient } from 'jsr:@supabase/supabase-js@2';

type ClimateImportRequestBody = {
  slug?: string;
  slugs?: string[];
  limit?: number;
  allow_non_pending?: boolean;
};

type DestinationRecord = {
  id: string;
  slug: string;
  name: string;
  country: string;
  country_code: string;
  latitude: number;
  longitude: number;
  timezone: string;
  climate_import_status: 'pending' | 'importing' | 'imported' | 'failed';
};

type OpenMeteoClimateResponse = {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: {
    time: string;
    relative_humidity_2m: string;
  };
  hourly: {
    time: string[];
    relative_humidity_2m: Array<number | null>;
  };
  daily_units: {
    time: string;
    temperature_2m_max: string;
    temperature_2m_min: string;
    precipitation_sum: string;
    sunshine_duration: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    sunshine_duration: number[];
  };
};

type MonthlyAccumulator = {
  month: number;
  highSum: number;
  highCount: number;
  lowSum: number;
  lowCount: number;
  sunshineHoursSum: number;
  sunshineDayCount: number;
  humiditySum: number;
  humidityCount: number;
  monthlyPrecipTotals: number[];
};

type NormalizedMonthlyClimateRow = {
  month: number;
  avg_high_c: number;
  avg_low_c: number;
  avg_precip_mm: number;
  avg_humidity: number | null;
  sunshine_hours: number | null;
  support: {
    high_days: number;
    low_days: number;
    sunshine_days: number;
    humidity_hours: number;
    precip_months: number;
  };
};

type ClimateImportWindow = {
  years: number;
  startDate: string;
  endDate: string;
  periodLabel: string;
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

const DESTINATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CLIMATE_SOURCE_NAME = 'open_meteo_historical_weather';
const OPEN_METEO_ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';
const CLIMATE_BASELINE_YEARS = 10;
const MAX_CLIMATE_IMPORT_BATCH = 3;
const DAILY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'sunshine_duration',
];
const HOURLY_VARIABLES = ['relative_humidity_2m'];

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: JSON_HEADERS,
  });
}

function requireEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function normalizeText(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string.`);
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return trimmedValue;
}

function normalizeSlug(value: unknown, fieldName: string) {
  const slug = normalizeText(value, fieldName).toLowerCase();

  if (!DESTINATION_SLUG_PATTERN.test(slug)) {
    throw new Error(`${fieldName} must be lowercase kebab-case.`);
  }

  return slug;
}

function normalizeBoolean(value: unknown, defaultValue: boolean) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'boolean') {
    throw new Error('allow_non_pending must be a boolean when provided.');
  }

  return value;
}

function normalizeLimit(value: unknown, defaultValue: number) {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const limit = Number(value);

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_CLIMATE_IMPORT_BATCH) {
    throw new Error(
      `limit must be an integer between 1 and ${MAX_CLIMATE_IMPORT_BATCH} when provided.`,
    );
  }

  return limit;
}

function parseRequestBody(rawBody: string): ClimateImportRequestBody {
  if (!rawBody.trim()) {
    return {};
  }

  const parsedBody = JSON.parse(rawBody);

  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    throw new Error('Request body must be a JSON object.');
  }

  return parsedBody as ClimateImportRequestBody;
}

function createImportWindow(now = new Date(), years = CLIMATE_BASELINE_YEARS): ClimateImportWindow {
  const lastCompleteYear = now.getUTCFullYear() - 1;
  const startYear = lastCompleteYear - years + 1;

  return {
    years,
    startDate: `${startYear}-01-01`,
    endDate: `${lastCompleteYear}-12-31`,
    periodLabel: `${startYear}-01-01 to ${lastCompleteYear}-12-31`,
  };
}

function roundToTwoDecimals(value: number) {
  return Number(value.toFixed(2));
}

function ensureArrayLength(fieldName: string, values: unknown[], expectedLength: number) {
  if (values.length !== expectedLength) {
    throw new Error(`${fieldName} length did not match the expected time axis.`);
  }
}

function extractMonthFromDate(dateValue: string) {
  const normalizedValue = dateValue.replace('T', '-');
  const parts = normalizedValue.split('-');
  const month = Number(parts[1]);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Unable to parse month from date value: ${dateValue}`);
  }

  return month;
}

function extractYearMonthKey(dateValue: string) {
  const normalizedValue = dateValue.replace('T', '-');
  const parts = normalizedValue.split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    throw new Error(`Unable to parse year-month key from date value: ${dateValue}`);
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

function createMonthlyAccumulators() {
  return new Map<number, MonthlyAccumulator>(
    Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;

      return [
        month,
        {
          month,
          highSum: 0,
          highCount: 0,
          lowSum: 0,
          lowCount: 0,
          sunshineHoursSum: 0,
          sunshineDayCount: 0,
          humiditySum: 0,
          humidityCount: 0,
          monthlyPrecipTotals: [],
        },
      ];
    }),
  );
}

function aggregateMonthlyClimate(
  destination: DestinationRecord,
  response: OpenMeteoClimateResponse,
  window: ClimateImportWindow,
) {
  const dailyTime = response.daily?.time ?? [];
  const hourlyTime = response.hourly?.time ?? [];
  const dailyHighs = response.daily?.temperature_2m_max ?? [];
  const dailyLows = response.daily?.temperature_2m_min ?? [];
  const dailyPrecipitation = response.daily?.precipitation_sum ?? [];
  const dailySunshine = response.daily?.sunshine_duration ?? [];
  const hourlyHumidity = response.hourly?.relative_humidity_2m ?? [];

  if (dailyTime.length === 0) {
    throw new Error(`No daily climate data returned for ${destination.slug}.`);
  }

  if (hourlyTime.length === 0) {
    throw new Error(`No hourly humidity data returned for ${destination.slug}.`);
  }

  ensureArrayLength('daily.temperature_2m_max', dailyHighs, dailyTime.length);
  ensureArrayLength('daily.temperature_2m_min', dailyLows, dailyTime.length);
  ensureArrayLength('daily.precipitation_sum', dailyPrecipitation, dailyTime.length);
  ensureArrayLength('daily.sunshine_duration', dailySunshine, dailyTime.length);
  ensureArrayLength('hourly.relative_humidity_2m', hourlyHumidity, hourlyTime.length);

  const monthlyAccumulators = createMonthlyAccumulators();
  const precipitationTotalsByYearMonth = new Map<string, number>();

  for (let index = 0; index < dailyTime.length; index += 1) {
    const month = extractMonthFromDate(dailyTime[index]);
    const accumulator = monthlyAccumulators.get(month)!;
    const highTemperature = Number(dailyHighs[index]);
    const lowTemperature = Number(dailyLows[index]);
    const precipitation = Number(dailyPrecipitation[index]);
    const sunshineDurationSeconds = Number(dailySunshine[index]);

    if (![highTemperature, lowTemperature, precipitation, sunshineDurationSeconds].every(Number.isFinite)) {
      throw new Error(`Daily climate data contained non-numeric values for ${destination.slug}.`);
    }

    accumulator.highSum += highTemperature;
    accumulator.highCount += 1;
    accumulator.lowSum += lowTemperature;
    accumulator.lowCount += 1;
    accumulator.sunshineHoursSum += sunshineDurationSeconds / 3600;
    accumulator.sunshineDayCount += 1;

    const yearMonthKey = extractYearMonthKey(dailyTime[index]);
    precipitationTotalsByYearMonth.set(
      yearMonthKey,
      (precipitationTotalsByYearMonth.get(yearMonthKey) ?? 0) + precipitation,
    );
  }

  for (const [yearMonthKey, monthlyPrecipitationTotal] of precipitationTotalsByYearMonth.entries()) {
    const month = Number(yearMonthKey.split('-')[1]);
    monthlyAccumulators.get(month)!.monthlyPrecipTotals.push(monthlyPrecipitationTotal);
  }

  for (let index = 0; index < hourlyTime.length; index += 1) {
    const humidityValue = hourlyHumidity[index];

    if (humidityValue === null || humidityValue === undefined) {
      continue;
    }

    const numericHumidity = Number(humidityValue);

    if (!Number.isFinite(numericHumidity)) {
      throw new Error(`Hourly humidity data contained non-numeric values for ${destination.slug}.`);
    }

    const month = extractMonthFromDate(hourlyTime[index]);
    const accumulator = monthlyAccumulators.get(month)!;
    accumulator.humiditySum += numericHumidity;
    accumulator.humidityCount += 1;
  }

  const rows: NormalizedMonthlyClimateRow[] = [];

  for (let month = 1; month <= 12; month += 1) {
    const accumulator = monthlyAccumulators.get(month)!;

    if (
      accumulator.highCount === 0
      || accumulator.lowCount === 0
      || accumulator.sunshineDayCount === 0
      || accumulator.monthlyPrecipTotals.length === 0
    ) {
      throw new Error(`Incomplete monthly climate coverage for ${destination.slug} month ${month}.`);
    }

    rows.push({
      month,
      avg_high_c: roundToTwoDecimals(accumulator.highSum / accumulator.highCount),
      avg_low_c: roundToTwoDecimals(accumulator.lowSum / accumulator.lowCount),
      avg_precip_mm: roundToTwoDecimals(
        accumulator.monthlyPrecipTotals.reduce((total, value) => total + value, 0)
          / accumulator.monthlyPrecipTotals.length,
      ),
      avg_humidity: accumulator.humidityCount > 0
        ? roundToTwoDecimals(accumulator.humiditySum / accumulator.humidityCount)
        : null,
      // Store sunshine as average hours per day in each month so the value stays consistent
      // with destination-page display needs instead of raw monthly totals.
      sunshine_hours: accumulator.sunshineDayCount > 0
        ? roundToTwoDecimals(accumulator.sunshineHoursSum / accumulator.sunshineDayCount)
        : null,
      support: {
        high_days: accumulator.highCount,
        low_days: accumulator.lowCount,
        sunshine_days: accumulator.sunshineDayCount,
        humidity_hours: accumulator.humidityCount,
        precip_months: accumulator.monthlyPrecipTotals.length,
      },
    });
  }

  return {
    rows,
    snapshotPayload: {
      source_name: CLIMATE_SOURCE_NAME,
      source_period: window.periodLabel,
      request: {
        endpoint: OPEN_METEO_ARCHIVE_API_URL,
        latitude: destination.latitude,
        longitude: destination.longitude,
        timezone: destination.timezone,
        start_date: window.startDate,
        end_date: window.endDate,
        daily: DAILY_VARIABLES,
        hourly: HOURLY_VARIABLES,
      },
      response_meta: {
        latitude: response.latitude,
        longitude: response.longitude,
        timezone: response.timezone,
        timezone_abbreviation: response.timezone_abbreviation,
        elevation: response.elevation,
        generationtime_ms: response.generationtime_ms,
      },
      units: {
        daily: response.daily_units,
        hourly: response.hourly_units,
      },
      normalized_monthly_climate: rows,
    },
  };
}

async function fetchHistoricalClimate(
  destination: DestinationRecord,
  window: ClimateImportWindow,
) {
  const url = new URL(OPEN_METEO_ARCHIVE_API_URL);
  url.searchParams.set('latitude', String(destination.latitude));
  url.searchParams.set('longitude', String(destination.longitude));
  url.searchParams.set('start_date', window.startDate);
  url.searchParams.set('end_date', window.endDate);
  url.searchParams.set('daily', DAILY_VARIABLES.join(','));
  url.searchParams.set('hourly', HOURLY_VARIABLES.join(','));
  url.searchParams.set('timezone', destination.timezone);
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('precipitation_unit', 'mm');

  const response = await fetch(url.toString());

  if (!response.ok) {
    const failureBody = await response.text();
    throw new Error(
      `Open-Meteo climate request failed for ${destination.slug} with ${response.status}: ${failureBody.slice(0, 500)}`,
    );
  }

  return response.json() as Promise<OpenMeteoClimateResponse>;
}

function deriveSelection(body: ClimateImportRequestBody) {
  const allowNonPending = normalizeBoolean(body.allow_non_pending, false);
  const hasSlug = body.slug !== undefined;
  const hasSlugs = body.slugs !== undefined;

  if (hasSlug && hasSlugs) {
    throw new Error('Provide either slug or slugs, not both.');
  }

  if (hasSlug) {
    return {
      allowNonPending,
      requestedSlugs: [normalizeSlug(body.slug, 'slug')],
      limit: 1,
    };
  }

  if (hasSlugs) {
    if (!Array.isArray(body.slugs)) {
      throw new Error('slugs must be an array when provided.');
    }

    const requestedSlugs = [...new Set(body.slugs.map((slug) => normalizeSlug(slug, 'slugs item')))];

    if (requestedSlugs.length === 0) {
      throw new Error('At least one slug must be provided when filtering climate imports.');
    }

    if (requestedSlugs.length > MAX_CLIMATE_IMPORT_BATCH) {
      throw new Error(
        `Requested ${requestedSlugs.length} destinations, which exceeds the allowed batch size of ${MAX_CLIMATE_IMPORT_BATCH}.`,
      );
    }

    return {
      allowNonPending,
      requestedSlugs,
      limit: requestedSlugs.length,
    };
  }

  return {
    allowNonPending,
    requestedSlugs: null,
    limit: normalizeLimit(body.limit, 1),
  };
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return jsonResponse(405, {
      error: 'Method not allowed.',
      allowed_method: 'POST',
    });
  }

  try {
    const ingestionSecret = requireEnv('SEASONSCOUT_INGESTION_SECRET');
    const providedSecret = request.headers.get('x-seasonscout-ingestion-secret');

    if (providedSecret !== ingestionSecret) {
      return jsonResponse(401, {
        error: 'Unauthorized.',
      });
    }

    const supabase = createClient(
      requireEnv('SUPABASE_URL'),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const body = parseRequestBody(await request.text());
    const selection = deriveSelection(body);
    let selectedDestinations: DestinationRecord[] = [];

    if (selection.requestedSlugs) {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, slug, name, country, country_code, latitude, longitude, timezone, climate_import_status')
        .in('slug', selection.requestedSlugs);

      if (error) {
        throw error;
      }

      const destinationBySlug = new Map((data ?? []).map((destination) => [destination.slug, destination]));
      const missingSlugs = selection.requestedSlugs.filter((slug) => !destinationBySlug.has(slug));

      if (missingSlugs.length > 0) {
        throw new Error(`Unknown destination slugs requested: ${missingSlugs.join(', ')}`);
      }

      selectedDestinations = selection.requestedSlugs.map((slug) => destinationBySlug.get(slug)!);

      if (!selection.allowNonPending) {
        const blockedDestinations = selectedDestinations.filter(
          (destination) => destination.climate_import_status !== 'pending',
        );

        if (blockedDestinations.length > 0) {
          throw new Error(
            `Only pending destinations can be imported without override. Blocked slugs: ${blockedDestinations
              .map((destination) => `${destination.slug} (${destination.climate_import_status})`)
              .join(', ')}`,
          );
        }
      }
    } else {
      const { data, error } = await supabase
        .from('destinations')
        .select('id, slug, name, country, country_code, latitude, longitude, timezone, climate_import_status')
        .eq('climate_import_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(selection.limit);

      if (error) {
        throw error;
      }

      selectedDestinations = data ?? [];
    }

    if (selectedDestinations.length === 0) {
      return jsonResponse(200, {
        message: 'No destinations matched the climate import selection.',
        selected_destination_count: 0,
      });
    }

    const importWindow = createImportWindow();
    const runMetadata = {
      import_mode: selection.requestedSlugs ? 'explicit_selection' : 'pending_queue',
      allow_non_pending: selection.allowNonPending,
      selected_slugs: selectedDestinations.map((destination) => destination.slug),
      source_name: CLIMATE_SOURCE_NAME,
      source_period: importWindow.periodLabel,
      climate_baseline_years: importWindow.years,
      weather_source_endpoint: OPEN_METEO_ARCHIVE_API_URL,
    };

    const { data: ingestionRun, error: ingestionRunError } = await supabase
      .from('ingestion_runs')
      .insert({
        pipeline_name: 'import-destination-climate',
        source_name: CLIMATE_SOURCE_NAME,
        source_version: importWindow.periodLabel,
        status: 'running',
        records_seen: selectedDestinations.length,
        metadata: runMetadata,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (ingestionRunError) {
      throw ingestionRunError;
    }

    const importResults: Array<{
      slug: string;
      status: 'imported' | 'failed';
      climate_rows_written?: number;
      best_months?: number[];
      error?: string;
    }> = [];
    let successfulDestinationCount = 0;
    let failedDestinationCount = 0;
    let climateRowsWritten = 0;
    let climateSnapshotsWritten = 0;

    for (const destination of selectedDestinations) {
      try {
        const { error: setImportingError } = await supabase
          .from('destinations')
          .update({ climate_import_status: 'importing' })
          .eq('id', destination.id);

        if (setImportingError) {
          throw setImportingError;
        }

        const climateResponse = await fetchHistoricalClimate(destination, importWindow);
        const { rows, snapshotPayload } = aggregateMonthlyClimate(destination, climateResponse, importWindow);
        const sourceLabel = `${CLIMATE_SOURCE_NAME}:${importWindow.periodLabel}`;

        const { error: snapshotError } = await supabase
          .from('climate_source_snapshots')
          .insert({
            destination_id: destination.id,
            ingestion_run_id: ingestionRun.id,
            source_name: CLIMATE_SOURCE_NAME,
            source_period: importWindow.periodLabel,
            payload: snapshotPayload,
          });

        if (snapshotError) {
          throw snapshotError;
        }

        climateSnapshotsWritten += 1;

        const { data: upsertedRows, error: upsertError } = await supabase
          .from('monthly_climate')
          .upsert(
            rows.map((row) => ({
              destination_id: destination.id,
              month: row.month,
              avg_high_c: row.avg_high_c,
              avg_low_c: row.avg_low_c,
              avg_precip_mm: row.avg_precip_mm,
              avg_humidity: row.avg_humidity,
              sunshine_hours: row.sunshine_hours,
              source: sourceLabel,
            })),
            {
              onConflict: 'destination_id,month',
            },
          )
          .select('month');

        if (upsertError) {
          throw upsertError;
        }

        const { data: derivativeResult, error: derivativeError } = await supabase
          .rpc('refresh_destination_climate_derivatives', {
            p_destination_id: destination.id,
          })
          .single();

        if (derivativeError) {
          throw derivativeError;
        }

        const { error: destinationStatusError } = await supabase
          .from('destinations')
          .update({ climate_import_status: 'imported' })
          .eq('id', destination.id);

        if (destinationStatusError) {
          throw destinationStatusError;
        }

        const { error: publishReadinessError } = await supabase
          .rpc('refresh_destination_publish_readiness', {
            p_destination_id: destination.id,
          });

        if (publishReadinessError) {
          throw publishReadinessError;
        }

        successfulDestinationCount += 1;
        climateRowsWritten += upsertedRows?.length ?? rows.length;
        importResults.push({
          slug: destination.slug,
          status: 'imported',
          climate_rows_written: upsertedRows?.length ?? rows.length,
          best_months: derivativeResult?.best_months ?? [],
        });
      } catch (error) {
        failedDestinationCount += 1;

        const failureStatus = destination.climate_import_status === 'imported'
          ? 'imported'
          : destination.climate_import_status === 'failed'
            ? 'failed'
            : 'failed';

        const { error: restoreStatusError } = await supabase
          .from('destinations')
          .update({ climate_import_status: failureStatus })
          .eq('id', destination.id);

        importResults.push({
          slug: destination.slug,
          status: 'failed',
          error: restoreStatusError
            ? `${error instanceof Error ? error.message : 'Unknown climate import failure.'} | status reset failed: ${restoreStatusError.message}`
            : error instanceof Error
              ? error.message
              : 'Unknown climate import failure.',
        });
      }
    }

    const ingestionStatus = successfulDestinationCount === selectedDestinations.length
      ? 'succeeded'
      : successfulDestinationCount > 0
        ? 'partial'
        : 'failed';
    const errorSummary = importResults
      .filter((result) => result.status === 'failed' && result.error)
      .map((result) => `${result.slug}: ${result.error}`)
      .join(' | ');

    const { error: finishRunError } = await supabase
      .from('ingestion_runs')
      .update({
        status: ingestionStatus,
        records_written: successfulDestinationCount,
        records_failed: failedDestinationCount,
        error_summary: errorSummary ? errorSummary.slice(0, 2000) : null,
        metadata: {
          ...runMetadata,
          climate_rows_written: climateRowsWritten,
          climate_source_snapshots_written: climateSnapshotsWritten,
        },
        finished_at: new Date().toISOString(),
      })
      .eq('id', ingestionRun.id);

    if (finishRunError) {
      throw finishRunError;
    }

    return jsonResponse(200, {
      ingestion_run_id: ingestionRun.id,
      source_name: CLIMATE_SOURCE_NAME,
      source_period: importWindow.periodLabel,
      imported_destination_count: successfulDestinationCount,
      failed_destination_count: failedDestinationCount,
      destinations_processed: importResults,
    });
  } catch (error) {
    const isServerMisconfiguration =
      error instanceof Error && error.message.startsWith('Missing required environment variable:');

    return jsonResponse(isServerMisconfiguration ? 500 : 400, {
      error: error instanceof Error ? error.message : 'Invalid climate import request.',
    });
  }
});
