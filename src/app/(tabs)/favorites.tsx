import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { ApartmentCardSkeleton } from '@/components/ui/shimmer-block';
import { Hoteliq, TAB_BAR_BODY_HEIGHT } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getFullFavoriteApartments } from '@/lib/favorites-service';
import type { Apartment } from '@/lib/types';

export default function FavoritesScreen() {
  const insets = useSafeAreaInsets();
  const { user, userData, loading: authLoading } = useAuth();
  const [apartments, setApartments] = useState<
    (Apartment & { isFavorited?: boolean })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFavorites = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) {
        setApartments([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);

      try {
        const ids = userData?.favorites;
        const list = await getFullFavoriteApartments(user.uid, ids);
        setApartments(list.map((apt) => ({ ...apt, isFavorited: true })));
      } catch (err) {
        console.error('Favorites load error:', err);
        setError('Không tải được danh sách yêu thích.');
        Alert.alert(
          'Lỗi',
          'Không tải được căn hộ yêu thích. Vui lòng thử lại.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, userData?.favorites],
  );

  useEffect(() => {
    if (authLoading) return;
    void loadFavorites('initial');
  }, [authLoading, loadFavorites]);

  const handleFavoriteToggle = useCallback(
    (apartmentId: string, isFavorited: boolean) => {
      if (!isFavorited) {
        setApartments((prev) => prev.filter((apt) => apt.id !== apartmentId));
      }
    },
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: Apartment }) => (
      <ApartmentCard
        apartment={item}
        variant="feed"
        onFavoriteToggle={handleFavoriteToggle}
      />
    ),
    [handleFavoriteToggle],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  if (authLoading) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Hoteliq.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingBottom: TAB_BAR_BODY_HEIGHT + insets.bottom + 16 }}>
          <View className="items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
            <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
              Đăng nhập để xem danh sách Yêu thích
            </Text>
            <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
              Bạn có thể tạo, xem hoặc chỉnh sửa danh sách yêu thích sau khi
              đăng nhập.
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable
                accessibilityRole="button"
                className="mt-1 h-12 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-7"
                style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                <Text className="text-sm font-semibold text-white">
                  Đăng nhập
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Page header — Airbnb "Wishlists" pattern */}
      <View className="gap-1.5 px-6 pb-4 pt-2">
        <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
          Căn hộ yêu thích
        </Text>
        {!loading ? (
          <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
            Tìm thấy{' '}
            <Text className="font-semibold text-hoteliq-ink">
              {apartments.length}
            </Text>{' '}
            kết quả
          </Text>
        ) : null}
      </View>

      {loading ? (
        <View className="px-6 pt-2">
          <ApartmentCardSkeleton />
          <ApartmentCardSkeleton />
        </View>
      ) : (
        <FlatList
          data={apartments}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingTop: 4,
            paddingBottom: TAB_BAR_BODY_HEIGHT + insets.bottom + 16,
            flexGrow: 1,
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                void loadFavorites('refresh');
              }}
              tintColor={Hoteliq.primary}
              colors={[Hoteliq.primary]}
            />
          }
          ListEmptyComponent={
            <View className="mt-2 items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
              {error ? (
                <>
                  <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                    Không tải được dữ liệu
                  </Text>
                  <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                    {error}
                  </Text>
                  <Pressable
                    onPress={() => void loadFavorites('initial')}
                    accessibilityRole="button"
                    className="mt-1 h-12 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-7"
                    style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                    <Text className="text-sm font-semibold text-white">
                      Thử lại
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                    <Text className="text-[26px] leading-8 text-hoteliq-heart">
                      ♡
                    </Text>
                  </View>
                  <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                    Danh sách yêu thích trống
                  </Text>
                  <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                    Bạn chưa có căn hộ yêu thích nào.
                  </Text>
                  <Link href="/(tabs)" asChild>
                    <Pressable
                      accessibilityRole="button"
                      className="mt-1 h-12 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-7"
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.88 : 1,
                      })}>
                      <Text className="text-sm font-semibold text-white">
                        Bắt đầu tìm kiếm
                      </Text>
                    </Pressable>
                  </Link>
                </>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}
