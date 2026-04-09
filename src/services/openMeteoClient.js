import { env } from '../app/config/env';
import { createServiceError } from './serviceError';

const currentFields = [
  'temperature_2m',
  'apparent_temperature',
  'relative_humidity_2m',
  'weather_code',
  'wind_speed_10m',
].join(',');

const dailyFields = [
  'weather_code',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_probability_max',
].join(',');

const forecastDays = 4;

function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

function getForecastEndpoint(baseUrl) {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return normalizedBaseUrl.endsWith('/forecast') ? normalizedBaseUrl : `${normalizedBaseUrl}/forecast`;
}

function buildForecastUrl({ latitude, longitude, timezone }) {
  const url = new URL(getForecastEndpoint(env.openMeteoBaseUrl));

  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', currentFields);
  url.searchParams.set('daily', dailyFields);
  url.searchParams.set('forecast_days', String(forecastDays));
  url.searchParams.set('timezone', timezone || 'auto');
  url.searchParams.set('temperature_unit', 'celsius');
  url.searchParams.set('wind_speed_unit', 'kmh');
  url.searchParams.set('precipitation_unit', 'mm');

  return url;
}

function hasCoordinates(destination) {
  return Number.isFinite(Number(destination?.latitude)) && Number.isFinite(Number(destination?.longitude));
}

async function parseErrorResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const payload = await response.json();

      return payload.reason || payload.error || payload.message || '';
    }

    return await response.text();
  } catch {
    return '';
  }
}

export async function fetchOpenMeteoForecast(destination) {
  if (!hasCoordinates(destination)) {
    throw createServiceError('Destination coordinates are required for live weather.');
  }

  const requestUrl = buildForecastUrl({
    latitude: Number(destination.latitude),
    longitude: Number(destination.longitude),
    timezone: destination.timezone,
  });

  let response;

  try {
    response = await fetch(requestUrl);
  } catch (error) {
    throw createServiceError('Unable to reach the weather provider.', error);
  }

  if (!response.ok) {
    const details = await parseErrorResponse(response);
    throw createServiceError(
      details
        ? `Weather provider request failed. ${details}`
        : `Weather provider request failed with status ${response.status}.`,
    );
  }

  const payload = await response.json();

  if (!payload?.current || !payload?.daily) {
    throw createServiceError('Weather provider returned an incomplete forecast payload.');
  }

  return payload;
}
