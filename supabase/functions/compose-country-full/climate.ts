export type ClimateDestinationRecord = {
  id: string;
  slug: string;
  latitude: number;
  longitude: number;
  timezone: string;
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

export type NormalizedMonthlyClimateRow = {
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

export type ClimateImportWindow = {
  years: number;
  startDate: string;
  endDate: string;
  periodLabel: string;
};

export const CLIMATE_SOURCE_NAME = 'open_meteo_historical_weather';
export const OPEN_METEO_ARCHIVE_API_URL = 'https://archive-api.open-meteo.com/v1/archive';
export const CLIMATE_BASELINE_YEARS = 10;

const DAILY_VARIABLES = [
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
  'sunshine_duration',
];
const HOURLY_VARIABLES = ['relative_humidity_2m'];

export function createImportWindow(now = new Date(), years = CLIMATE_BASELINE_YEARS): ClimateImportWindow {
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

export function aggregateMonthlyClimate(
  destination: ClimateDestinationRecord,
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

export async function fetchHistoricalClimate(
  destination: ClimateDestinationRecord,
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
