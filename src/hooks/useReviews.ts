import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RatingService } from '../services/api/ratingService';
import { useAuth } from '../app/AuthContext';

export const useReviews = () => {
  const { t } = useTranslation();
  const { vendor } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [summary, setSummary] = useState({ averageRating: 0, totalRatings: 0 });
  const [reviews, setReviews] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!vendor?.id) return;
    try {
      const [sumRes, revRes] = await Promise.all([
        RatingService.getSummary(vendor.id),
        RatingService.getReviews(vendor.id),
      ]);
      setSummary(sumRes.data || { averageRating: 0, totalRatings: 0 });
      setReviews(revRes.data || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [vendor?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  return {
    t,
    loading,
    refreshing,
    error,
    summary,
    reviews,
    refresh,
  };
};
