import { useCallback, useEffect, useRef, useState } from 'react';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import {
  fetchApartmentsPage,
  type ApartmentFilters,
} from '@/lib/apartments-service';
import type { Apartment } from '@/lib/types';

type UseApartmentsState = {
  apartments: Apartment[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
};

function filtersKey(filters: ApartmentFilters): string {
  return JSON.stringify({
    district: filters.district ?? '',
    priceRange: filters.priceRange ?? '',
    roomType: filters.roomType ?? '',
    sortBy: filters.sortBy ?? 'newest',
    searchQuery: filters.searchQuery ?? '',
  });
}

export function useApartments(filters: ApartmentFilters): UseApartmentsState {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const requestIdRef = useRef(0);
  const key = filtersKey(filters);

  const loadPage = useCallback(
    async (mode: 'initial' | 'refresh' | 'more') => {
      const requestId = ++requestIdRef.current;

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      if (mode === 'more') setLoadingMore(true);
      setError(null);

      try {
        const cursor = mode === 'more' ? cursorRef.current : null;
        const result = await fetchApartmentsPage(filters, cursor);

        if (requestId !== requestIdRef.current) return;

        cursorRef.current = result.lastDoc;
        setHasMore(result.hasMore);
        setApartments((prev) =>
          mode === 'more'
            ? dedupeApartments([...prev, ...result.apartments])
            : result.apartments,
        );
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error('useApartments load error:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Không tải được danh sách căn hộ.',
        );
        if (mode !== 'more') {
          setApartments([]);
          setHasMore(false);
        }
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    // Intentionally keyed by serialized filters
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );

  useEffect(() => {
    cursorRef.current = null;
    void loadPage('initial');
  }, [loadPage]);

  return {
    apartments,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    reload: () => loadPage('initial'),
    refresh: () => loadPage('refresh'),
    loadMore: async () => {
      if (loading || refreshing || loadingMore || !hasMore) return;
      await loadPage('more');
    },
  };
}

function dedupeApartments(items: Apartment[]): Apartment[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}
