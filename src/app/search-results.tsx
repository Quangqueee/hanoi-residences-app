import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { ListPaginationFooter } from '@/components/list-pagination-footer';
import { SortPills, type SortOption } from '@/components/sort-pills';
import { ApartmentCardSkeleton } from '@/components/ui/shimmer-block';
import { useApartments } from '@/hooks/use-apartments';
import type { ApartmentFilters } from '@/lib/apartments-service';
import {
  filterStateToApartmentFilters,
  parseSearchQueryData,
  summarizeFilterState,
  type FilterState,
} from '@/lib/search-params';
import type { Apartment } from '@/lib/types';

const BRAND = '#CDA533';
const BRAND_DARK = '#B88E22';

function toServiceFilters(
  filterState: FilterState,
  sort: SortOption,
): { query: string; apartmentFilters: ApartmentFilters } {
  const converted = filterStateToApartmentFilters(filterState, sort);
  if (!converted.ok) {
    return {
      query: filterState.query.trim(),
      apartmentFilters: { sortBy: sort },
    };
  }
  return {
    query: converted.query,
    apartmentFilters: converted.apartmentFilters,
  };
}

export default function SearchResultsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { queryData } = useLocalSearchParams<{ queryData?: string }>();

  const payload = useMemo(
    () => parseSearchQueryData(queryData),
    [queryData],
  );

  const [filterState, setFilterState] = useState<FilterState>(payload.filters);
  const [sort, setSort] = useState<SortOption>(payload.sort);

  useEffect(() => {
    setFilterState(payload.filters);
    setSort(payload.sort);
  }, [payload]);

  const { query, apartmentFilters } = useMemo(
    () => toServiceFilters(filterState, sort),
    [filterState, sort],
  );

  const {
    apartments,
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    refresh,
    loadMore,
    reload,
  } = useApartments(apartmentFilters);

  const filteredApartments = useMemo(() => {
    const q = query.toLowerCase();
    if (!q) return apartments;
    return apartments.filter((apt) => {
      const title = (apt.title ?? '').toLowerCase();
      const code = (apt.sourceCode ?? '').toLowerCase();
      const district = (apt.district ?? '').toLowerCase();
      const seo = (apt.aiContent?.seoTitle ?? '').toLowerCase();
      return (
        title.includes(q) ||
        code.includes(q) ||
        district.includes(q) ||
        seo.includes(q)
      );
    });
  }, [apartments, query]);

  const summary = useMemo(
    () => summarizeFilterState(filterState, sort),
    [filterState, sort],
  );

  const onSortChange = (next: SortOption) => {
    setSort(next);
  };

  const editFilters = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/search');
    }
  };

  const renderItem = useCallback(
    ({ item }: { item: Apartment }) => <ApartmentCard apartment={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  const showSkeleton = loading && apartments.length === 0;

  const listHeader = (
    <View className="mb-4 gap-4 pt-1">
      <Text className="text-[15px] font-semibold text-brand-muted">
        {showSkeleton
          ? 'Đang tìm kiếm…'
          : `Tìm thấy ${filteredApartments.length}${
              hasMore && !query ? '+' : ''
            } căn hộ phù hợp`}
      </Text>

      <SortPills value={sort} onChange={onSortChange} />
    </View>
  );

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2.5 px-3 pb-3.5 pt-1.5">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/search');
          }}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full bg-white">
          <Text className="text-lg font-semibold text-foreground">←</Text>
        </Pressable>

        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8A29A]">
            Kết quả
          </Text>
          <Text
            className="text-[15px] font-semibold text-foreground"
            numberOfLines={1}>
            {summary}
          </Text>
        </View>

        <Pressable
          onPress={editFilters}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sửa bộ lọc"
          className="rounded-full bg-brand-soft px-3.5 py-2"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text className="text-[13px] font-semibold text-brand">Sửa bộ lọc</Text>
        </Pressable>
      </View>

      <FlatList
        data={showSkeleton ? [] : filteredApartments}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refresh();
            }}
            tintColor={BRAND}
            colors={[BRAND]}
          />
        }
        onEndReached={() => {
          void loadMore();
        }}
        onEndReachedThreshold={0.4}
        ListEmptyComponent={
          showSkeleton ? (
            <View className="mt-1">
              <ApartmentCardSkeleton />
              <ApartmentCardSkeleton />
              <ApartmentCardSkeleton />
            </View>
          ) : (
            <View className="items-center gap-3 rounded-3xl border border-brand-border bg-white px-7 py-10">
              <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-[#FBF8F1]">
                <Text className="text-3xl text-brand">⌕</Text>
              </View>
              <Text className="text-center text-[18px] font-bold tracking-tight text-foreground">
                {error
                  ? 'Không tải được danh sách'
                  : 'Không tìm thấy kết quả phù hợp'}
              </Text>
              <Text className="text-center text-sm leading-5 text-brand-muted">
                {error
                  ? error
                  : 'Thử đổi từ khóa, nới khoảng giá hoặc chỉnh lại bộ lọc.'}
              </Text>
              {error ? (
                <Pressable
                  onPress={() => void reload()}
                  hitSlop={8}
                  className="mt-2 min-h-11 items-center justify-center rounded-full bg-brand px-6"
                  style={({ pressed }) => [
                    pressed ? { backgroundColor: BRAND_DARK } : null,
                  ]}>
                  <Text className="text-sm font-bold text-white">Thử lại</Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={editFilters}
                  hitSlop={8}
                  className="mt-2 min-h-11 items-center justify-center rounded-full bg-brand px-6"
                  style={({ pressed }) => [
                    pressed ? { backgroundColor: BRAND_DARK } : null,
                  ]}>
                  <Text className="text-sm font-bold text-white">Tìm lại</Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          showSkeleton ? null : (
            <ListPaginationFooter
              loadingMore={loadingMore}
              hasMore={hasMore && !query}
              itemCount={filteredApartments.length}
            />
          )
        }
      />
    </View>
  );
}
