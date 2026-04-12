import { hasSupabaseClient } from '../lib/supabaseClient';
import {
  approveReview,
  deleteReview,
  fetchAdminReviews,
  fetchApprovedCountryReviews,
  fetchApprovedDestinationReviews,
  fetchPendingReviewCount,
  insertReview,
} from './reviewsDataSource';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function withLatency(data) {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(data), 120);
  });
}

function formatReview(review) {
  return {
    id: review.id,
    createdAt: review.created_at,
    userName: review.user_name,
    rating: Number(review.rating) || 0,
    content: review.content,
    visitMonth: review.visit_month ? monthNames[review.visit_month - 1] : '',
    visitMonthNumber: review.visit_month ?? null,
    status: review.status,
    countryId: review.country_id ?? null,
    destinationId: review.destination_id ?? null,
    country: review.country
      ? {
        code: review.country.code,
        name: review.country.name,
        slug: review.country.slug,
      }
      : null,
    destination: review.destination
      ? {
        id: review.destination.id,
        name: review.destination.name,
        slug: review.destination.slug,
        countryCode: review.destination.country_code ?? null,
      }
      : null,
  };
}

export const reviewsService = {
  monthOptions: monthNames.map((month, index) => ({
    label: month,
    value: index + 1,
  })),

  async getApprovedCountryReviews(countryId) {
    if (!hasSupabaseClient()) {
      return withLatency([]);
    }

    const rows = await fetchApprovedCountryReviews(countryId);
    return rows.map(formatReview);
  },

  async getApprovedDestinationReviews(destinationId) {
    if (!hasSupabaseClient()) {
      return withLatency([]);
    }

    const rows = await fetchApprovedDestinationReviews(destinationId);
    return rows.map(formatReview);
  },

  async submitCountryReview(payload) {
    const row = await insertReview({
      user_name: payload.userName,
      rating: payload.rating,
      content: payload.content,
      visit_month: payload.visitMonth || null,
      country_id: payload.countryId,
    });

    return formatReview(row);
  },

  async submitDestinationReview(payload) {
    const row = await insertReview({
      user_name: payload.userName,
      rating: payload.rating,
      content: payload.content,
      visit_month: payload.visitMonth || null,
      destination_id: payload.destinationId,
    });

    return formatReview(row);
  },

  async getAdminReviews(filter = 'pending') {
    const rows = await fetchAdminReviews(filter);
    return rows.map(formatReview);
  },

  async getPendingReviewCount() {
    return fetchPendingReviewCount();
  },

  async approveReview(reviewId) {
    const row = await approveReview(reviewId);
    return formatReview(row);
  },

  async deleteReview(reviewId) {
    return deleteReview(reviewId);
  },
};
