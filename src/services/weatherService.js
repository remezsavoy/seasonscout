import { env } from '../app/config/env';
import { destinationShells, weatherSnapshots } from './mockData';
import { fetchOpenMeteoForecast } from './openMeteoClient';

const weatherCodeMap = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Freezing fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Heavy showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm',
};

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

function formatTemperature(value) {
  return `${Math.round(Number(value))} C`;
}

function formatWind(value) {
  return `${Math.round(Number(value))} km/h`;
}

function formatPercent(value) {
  return `${Math.round(Number(value))}%`;
}

function getWeatherLabel(weatherCode) {
  return weatherCodeMap[Number(weatherCode)] || 'Variable conditions';
}

function formatUpdatedAtLabel(timestamp, timezone) {
  if (!timestamp) {
    return 'Updated via Open-Meteo';
  }

  const [datePart, timePart = ''] = String(timestamp).split('T');

  return timezone ? `Updated ${datePart} ${timePart} / ${timezone}` : `Updated ${datePart} ${timePart}`.trim();
}

function formatDayLabel(dateString, index) {
  if (index === 0) {
    return 'Today';
  }

  if (index === 1) {
    return 'Tomorrow';
  }

  const date = new Date(`${dateString}T12:00:00`);

  return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
}

function buildCurrentSummary(current) {
  const condition = getWeatherLabel(current.weather_code).toLowerCase();

  return `Currently ${condition} with humidity near ${formatPercent(current.relative_humidity_2m)} and winds around ${formatWind(current.wind_speed_10m)}.`;
}

function buildFallbackWeatherSnapshot(destination) {
  return {
    current: {
      condition: 'Weather preview ready',
      temperature_c: 20,
      feels_like_c: 20,
      humidity_percent: 55,
      wind_kph: 12,
      updated_label: 'Prepared fallback weather snapshot',
      summary:
        'Current conditions and the short forecast will use a prepared fallback when live weather cannot be loaded.',
    },
    forecast: [
      { day_label: 'Today', condition: 'Clear intervals', high_c: 22, low_c: 14, precipitation_chance: 10 },
      { day_label: 'Tomorrow', condition: 'Partly cloudy', high_c: 21, low_c: 13, precipitation_chance: 15 },
      { day_label: 'Sat', condition: 'Cloudy', high_c: 20, low_c: 12, precipitation_chance: 20 },
      { day_label: 'Sun', condition: 'Light rain', high_c: 19, low_c: 11, precipitation_chance: 35 },
    ],
    note: destination?.timezone
      ? `Live weather is currently unavailable, so SeasonScout is showing a prepared fallback snapshot for ${destination.timezone}.`
      : 'Live weather is currently unavailable, so SeasonScout is showing a prepared fallback snapshot.',
  };
}

function mapFallbackSnapshot(snapshot, destination) {
  return {
    provider: 'Open-Meteo fallback',
    baseUrl: env.openMeteoBaseUrl,
    timezone: destination?.timezone ?? null,
    current: {
      condition: snapshot.current.condition,
      temperature: formatTemperature(snapshot.current.temperature_c),
      summary: snapshot.current.summary,
      updatedAt: snapshot.current.updated_label,
      metrics: [
        {
          label: 'Feels like',
          value: formatTemperature(snapshot.current.feels_like_c),
        },
        {
          label: 'Humidity',
          value: formatPercent(snapshot.current.humidity_percent),
        },
        {
          label: 'Wind',
          value: formatWind(snapshot.current.wind_kph),
        },
        {
          label: 'Timezone',
          value: destination?.timezone ?? 'Local time pending',
        },
      ],
    },
    forecast: (snapshot.forecast ?? []).map((day) => ({
      dayLabel: day.day_label,
      condition: day.condition,
      high: formatTemperature(day.high_c),
      low: formatTemperature(day.low_c),
      precipitationChance: formatPercent(day.precipitation_chance),
    })),
    note: snapshot.note,
  };
}

function normalizeOpenMeteoWeather(payload, destination) {
  const current = payload.current;
  const daily = payload.daily;
  const forecastLength = Array.isArray(daily.time) ? daily.time.length : 0;
  const timezone = destination?.timezone || payload.timezone || null;

  return {
    provider: 'Open-Meteo',
    baseUrl: env.openMeteoBaseUrl,
    timezone,
    current: {
      condition: getWeatherLabel(current.weather_code),
      temperature: formatTemperature(current.temperature_2m),
      summary: buildCurrentSummary(current),
      updatedAt: formatUpdatedAtLabel(current.time, timezone),
      metrics: [
        {
          label: 'Feels like',
          value: formatTemperature(current.apparent_temperature),
        },
        {
          label: 'Humidity',
          value: formatPercent(current.relative_humidity_2m),
        },
        {
          label: 'Wind',
          value: formatWind(current.wind_speed_10m),
        },
        {
          label: 'Timezone',
          value: timezone || 'Local time pending',
        },
      ],
    },
    forecast: Array.from({ length: forecastLength }, (_, index) => ({
      dayLabel: formatDayLabel(daily.time[index], index),
      condition: getWeatherLabel(daily.weather_code[index]),
      high: formatTemperature(daily.temperature_2m_max[index]),
      low: formatTemperature(daily.temperature_2m_min[index]),
      precipitationChance: formatPercent(daily.precipitation_probability_max[index] ?? 0),
    })),
    note: 'Live weather is loaded from Open-Meteo and normalized in the service layer so the page contract stays stable.',
  };
}

function getFallbackResponse(slug, destination) {
  const snapshot = weatherSnapshots[slug] ?? buildFallbackWeatherSnapshot(destination);

  return withLatency(mapFallbackSnapshot(snapshot, destination));
}

export const weatherService = {
  async getWeatherPreview(slug, options = {}) {
    const destination = options.destination ?? destinationShells[slug];

    if (!destination) {
      return getFallbackResponse(slug, null);
    }

    try {
      const payload = await fetchOpenMeteoForecast(destination);

      return normalizeOpenMeteoWeather(payload, destination);
    } catch {
      return getFallbackResponse(slug, destination);
    }
  },
};
