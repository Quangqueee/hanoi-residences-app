import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { useAuth } from '@/contexts/auth-context';
import { getFullFavoriteApartments } from '@/lib/favorites-service';
import type { Apartment } from '@/lib/types';

const UI = {
  primary: '#1E75FF',
  ink: '#1A1A1A',
  muted: '#7A7A7A',
  canvas: '#FFFFFF',
  soft: '#F3F5F9',
  border: '#E5E7EB',
  heart: '#EF4444',
} as const;

const TAB_BAR_CLEARANCE = 100;

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
        onFavoriteToggle={handleFavoriteToggle}
      />
    ),
    [handleFavoriteToggle],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  const screenPad = [
    styles.safe,
    { paddingTop: insets.top, backgroundColor: UI.canvas },
  ];

  if (authLoading) {
    return (
      <View style={screenPad}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={UI.primary} />
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={screenPad}>
        <View style={styles.centeredPad}>
          <Text style={styles.emptyTitle}>
            Đăng nhập để xem danh sách Yêu thích
          </Text>
          <Text style={styles.emptyBody}>
            Bạn có thể tạo, xem hoặc chỉnh sửa danh sách yêu thích sau khi đăng
            nhập.
          </Text>
          <Link href="/(auth)/login" asChild>
            <Pressable
              style={({ pressed }) => [
                styles.ctaBtn,
                pressed && styles.ctaPressed,
              ]}>
              <Text style={styles.ctaText}>Đăng nhập</Text>
            </Pressable>
          </Link>
        </View>
      </View>
    );
  }

  return (
    <View style={screenPad}>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Căn hộ yêu thích</Text>
          {!loading ? (
            <Text style={styles.countText}>
              Tìm thấy{' '}
              <Text style={styles.countBold}>{apartments.length}</Text> kết quả
            </Text>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonLineWide} />
                <View style={styles.skeletonLineMid} />
                <View style={styles.skeletonLineShort} />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            data={apartments}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void loadFavorites('refresh');
                }}
                tintColor={UI.primary}
                colors={[UI.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                {error ? (
                  <>
                    <Text style={styles.emptyTitle}>Không tải được dữ liệu</Text>
                    <Text style={styles.emptyBody}>{error}</Text>
                    <Pressable
                      onPress={() => void loadFavorites('initial')}
                      style={({ pressed }) => [
                        styles.ctaBtn,
                        pressed && styles.ctaPressed,
                      ]}>
                      <Text style={styles.ctaText}>Thử lại</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.heartRing}>
                      <View style={styles.heartInner}>
                        <Text style={styles.heartGlyph}>♡</Text>
                      </View>
                    </View>
                    <Text style={styles.emptyTitle}>
                      Danh sách yêu thích trống
                    </Text>
                    <Text style={styles.emptyBody}>
                      Bạn chưa có căn hộ yêu thích nào.
                    </Text>
                    <Link href="/(tabs)" asChild>
                      <Pressable
                        style={({ pressed }) => [
                          styles.ctaBtn,
                          pressed && styles.ctaPressed,
                        ]}>
                        <Text style={styles.ctaText}>Bắt đầu tìm kiếm</Text>
                      </Pressable>
                    </Link>
                  </>
                )}
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: UI.canvas,
  },
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredPad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
    paddingBottom: TAB_BAR_CLEARANCE,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 6,
  },
  pageTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: UI.ink,
    letterSpacing: -0.6,
  },
  countText: {
    fontSize: 14,
    color: UI.muted,
    fontWeight: '500',
  },
  countBold: {
    color: UI.ink,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_CLEARANCE,
    flexGrow: 1,
  },
  skeletonList: {
    paddingHorizontal: 20,
    gap: 20,
  },
  skeletonCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.border,
    padding: 12,
    gap: 10,
    backgroundColor: '#FAFBFC',
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 12,
    backgroundColor: UI.soft,
  },
  skeletonLineWide: {
    height: 16,
    width: '75%',
    borderRadius: 6,
    backgroundColor: UI.soft,
  },
  skeletonLineMid: {
    height: 12,
    width: '50%',
    borderRadius: 6,
    backgroundColor: UI.soft,
  },
  skeletonLineShort: {
    height: 12,
    width: '33%',
    borderRadius: 6,
    backgroundColor: UI.soft,
  },
  emptyWrap: {
    marginTop: 48,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 10,
  },
  heartRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: UI.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  heartInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: UI.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartGlyph: {
    fontSize: 32,
    color: UI.muted,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: UI.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: UI.muted,
    textAlign: 'center',
    maxWidth: 300,
  },
  ctaBtn: {
    marginTop: 12,
    minHeight: 48,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.88,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
