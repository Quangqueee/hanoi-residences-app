import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { ListPaginationFooter } from '@/components/list-pagination-footer';
import {
  ApartmentCardSkeleton,
  ApartmentListSkeleton,
} from '@/components/ui/shimmer-block';
import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useApartments } from '@/hooks/use-apartments';
import { useNotifications } from '@/hooks/use-notifications';
import type { ApartmentFilters } from '@/lib/apartments-service';
import type { Apartment, RoomType } from '@/lib/types';

const TAB_BAR_CLEARANCE = 108;
const NEAR_COUNT = 6;

type CategoryKey = 'all' | RoomType;

const CATEGORIES: {
  key: CategoryKey;
  label: string;
  ios: string;
  android: string;
}[] = [
  {
    key: 'all',
    label: 'Hotel',
    ios: 'building.2.fill',
    android: 'apartment',
  },
  {
    key: 'studio',
    label: 'Homestay',
    ios: 'house.fill',
    android: 'cottage',
  },
  {
    key: '1n1k',
    label: 'Apart',
    ios: 'building.fill',
    android: 'domain',
  },
  {
    key: '2n1k',
    label: '2PN',
    ios: 'square.split.2x1.fill',
    android: 'view_quilt',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, userData } = useAuth();
  const { unreadCount } = useNotifications(user?.uid);
  const [category, setCategory] = useState<CategoryKey>('all');

  const filters = useMemo<ApartmentFilters>(() => {
    const next: ApartmentFilters = { sortBy: 'newest' };
    if (category !== 'all') next.roomType = category;
    return next;
  }, [category]);

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
  } = useApartments(filters);

  const preferredDistrict =
    userData?.preferredDistrict?.trim() || 'Hà Nội, Việt Nam';

  const nearList = useMemo(
    () => apartments.slice(0, NEAR_COUNT),
    [apartments],
  );

  const popularList = useMemo(
    () => apartments.slice(NEAR_COUNT),
    [apartments],
  );

  const goToSearch = () => {
    router.navigate('/search');
  };

  const renderItem = useCallback(
    ({ item }: { item: Apartment }) => (
      <ApartmentCard apartment={item} variant="feed" />
    ),
    [],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  const listHeader = (
    <View className="mb-2 gap-6 pt-1">
      {/* Location + notifications */}
      <View className="flex-row items-start justify-between gap-3">
        <Pressable
          onPress={goToSearch}
          accessibilityRole="button"
          accessibilityLabel="Chọn khu vực"
          className="min-w-0 flex-1 gap-1">
          <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
            Current location
          </Text>
          <View className="flex-row items-center gap-1.5">
            <SymbolView
              name={{
                ios: 'mappin.and.ellipse',
                android: 'location_on',
                web: 'location_on',
              }}
              size={16}
              tintColor={Hoteliq.ink}
              weight="semibold"
            />
            <Text
              className="flex-1 text-[16px] font-semibold leading-[22px] text-hoteliq-ink"
              numberOfLines={1}>
              {preferredDistrict}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel="Thông báo"
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full border border-hoteliq-line bg-white"
          style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}>
          <SymbolView
            name={{
              ios: unreadCount > 0 ? 'bell.badge.fill' : 'bell',
              android: 'notifications_none',
              web: 'notifications_none',
            }}
            size={20}
            tintColor={Hoteliq.ink}
            weight="medium"
          />
          {unreadCount > 0 ? (
            <View className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-hoteliq-heart" />
          ) : null}
        </Pressable>
      </View>

      {/* Category tabs — Airbnb style: icon trên, label dưới, gạch chân khi active */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 18, paddingRight: 8 }}>
        {CATEGORIES.map((item) => {
          const active = category === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setCategory(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`min-h-[56px] min-w-[56px] items-center justify-center gap-1 border-b-2 px-2 pb-2.5 pt-1 ${
                active ? 'border-hoteliq-ink' : 'border-transparent'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <SymbolView
                name={{
                  ios: item.ios as 'building.2.fill',
                  android: item.android as 'apartment',
                  web: item.android as 'apartment',
                }}
                size={24}
                tintColor={active ? Hoteliq.ink : Hoteliq.muted}
                weight={active ? 'semibold' : 'regular'}
              />
              <Text
                className={`text-[12px] leading-4 ${
                  active
                    ? 'font-semibold text-hoteliq-ink'
                    : 'font-medium text-hoteliq-gray'
                }`}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Near Location rail */}
      <View className="gap-3.5">
        <View className="flex-row items-center justify-between">
          <Text className="text-[22px] font-semibold leading-7 text-hoteliq-ink">
            Near Location
          </Text>
          <Pressable onPress={goToSearch} hitSlop={8} className="min-h-[44px] justify-center">
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              See all
            </Text>
          </Pressable>
        </View>

        {loading && apartments.length === 0 ? (
          <ApartmentListSkeleton count={3} variant="rail" />
        ) : nearList.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            contentContainerStyle={{ paddingRight: 8, gap: 14 }}>
            {nearList.map((item) => (
              <ApartmentCard
                key={`near-${item.id}`}
                apartment={item}
                variant="rail"
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      {/* Popular section title */}
      {!loading && apartments.length > 0 ? (
        <View className="mt-1 flex-row items-center justify-between">
          <Text className="text-[22px] font-semibold leading-7 text-hoteliq-ink">
            Popular Hotel
          </Text>
          <Pressable onPress={goToSearch} hitSlop={8} className="min-h-[44px] justify-center">
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              See all
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );

  const listData =
    loading && apartments.length === 0
      ? []
      : popularList.length > 0
        ? popularList
        : apartments;

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <FlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: TAB_BAR_CLEARANCE,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={10}
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
          loading ? (
            <View className="mt-2 gap-3">
              <ApartmentCardSkeleton />
              <ApartmentCardSkeleton />
            </View>
          ) : (
            <View className="items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
              <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                {error ? 'Không tải được danh sách' : 'Chưa có căn phù hợp'}
              </Text>
              <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                {error
                  ? error
                  : 'Mở tab Tìm kiếm để lọc theo quận, giá hoặc loại phòng.'}
              </Text>
              {error ? (
                <Pressable
                  onPress={() => void reload()}
                  className="mt-1 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-semibold text-white">
                    Thử lại
                  </Text>
                </Pressable>
              ) : (
                <Pressable
                  onPress={goToSearch}
                  className="mt-1 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-semibold text-white">
                    Tìm kiếm
                  </Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          <ListPaginationFooter
            loadingMore={loadingMore}
            hasMore={hasMore}
            itemCount={apartments.length}
          />
        }
      />
    </View>
  );
}
