import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
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
import { Hoteliq } from '@/constants/theme';
import { useApartments } from '@/hooks/use-apartments';
import type { ApartmentFilters } from '@/lib/apartments-service';
import {
  filterStateToApartmentFilters,
  parseSearchQueryData,
  summarizeFilterState,
  type FilterState,
} from '@/lib/search-params';
import type { Apartment } from '@/lib/types';

function toServiceFilters(
  filterState: FilterState,
  sort: SortOption,
): { apartmentFilters: ApartmentFilters } {
  const converted = filterStateToApartmentFilters(filterState, sort);
  if (!converted.ok) {
    return {
      apartmentFilters: {
        sortBy: sort,
        searchQuery: filterState.query.trim() || undefined,
      },
    };
  }
  return {
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

  const { apartmentFilters } = useMemo(
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
      <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
        {showSkeleton
          ? 'Đang tìm kiếm…'
          : `Tìm thấy ${apartments.length}${
              hasMore ? '+' : ''
            } căn hộ phù hợp`}
      </Text>

      <SortPills value={sort} onChange={onSortChange} />
    </View>
  );

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-2.5 px-4 pb-3.5 pt-1.5">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/search');
          }}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          className="h-11 w-11 items-center justify-center rounded-full border border-hoteliq-line bg-white">
          <SymbolView
            name={{
              ios: 'chevron.left',
              android: 'arrow_back',
              web: 'arrow_back',
            }}
            size={18}
            tintColor={Hoteliq.ink}
            weight="semibold"
          />
        </Pressable>

        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[12px] leading-4 text-hoteliq-gray">
            Kết quả
          </Text>
          <Text
            className="text-[15px] font-semibold leading-5 text-hoteliq-ink"
            numberOfLines={1}>
            {summary}
          </Text>
        </View>

        <Pressable
          onPress={editFilters}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Sửa bộ lọc"
          className="min-h-11 items-center justify-center rounded-full border border-hoteliq-line bg-white px-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Text className="text-[13px] font-semibold text-hoteliq-ink">
            Sửa bộ lọc
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={showSkeleton ? [] : apartments}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: 24,
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
            tintColor={Hoteliq.primary}
            colors={[Hoteliq.primary]}
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
            <View className="items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
              <View className="mb-1 h-16 w-16 items-center justify-center rounded-full bg-white">
                <SymbolView
                  name={{
                    ios: 'magnifyingglass',
                    android: 'search',
                    web: 'search',
                  }}
                  size={26}
                  tintColor={Hoteliq.ink}
                  weight="regular"
                />
              </View>
              <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                {error
                  ? 'Không tải được danh sách'
                  : 'Không tìm thấy kết quả phù hợp'}
              </Text>
              <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                {error
                  ? error
                  : 'Thử đổi từ khóa, nới khoảng giá hoặc chỉnh lại bộ lọc.'}
              </Text>
              {error ? (
                <Pressable
                  onPress={() => void reload()}
                  hitSlop={8}
                  className="mt-2 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-semibold text-white">
                    Thử lại
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={editFilters}
                  hitSlop={8}
                  className="mt-2 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-semibold text-white">
                    Tìm lại
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          showSkeleton ? null : (
            <ListPaginationFooter
              loadingMore={loadingMore}
              hasMore={hasMore}
              itemCount={apartments.length}
            />
          )
        }
      />
    </View>
  );
}
