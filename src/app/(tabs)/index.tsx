import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { ApartmentFiltersBar } from '@/components/apartment-filters-bar';
import { useAuth } from '@/contexts/auth-context';
import { useApartments } from '@/hooks/use-apartments';
import type { ApartmentFilters } from '@/lib/apartments-service';
import type { Apartment } from '@/lib/types';

/** Brand tokens from hanoiresidence.site */
const Brand = {
  primary: '#CDA533',
  primaryDark: '#B88E22',
  ink: '#222222',
  muted: '#6B655C',
  canvas: '#FBF8F1',
  surface: '#FFFFFF',
  border: '#EBE6DA',
} as const;

export default function HomeScreen() {
  const { userData, roleLabel } = useAuth();

  const [filters, setFilters] = useState<ApartmentFilters>({
    sortBy: 'newest',
  });

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

  const renderItem = useCallback(
    ({ item }: { item: Apartment }) => <ApartmentCard apartment={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.greetingCard}>
        <Text style={styles.eyebrow}>Hanoi Residences</Text>
        <Text style={styles.greetingTitle}>Khám phá căn hộ</Text>
        <Text style={styles.greetingSub}>
          Xin chào, {userData?.displayName || userData?.email || 'bạn'}
          {roleLabel ? ` · ${roleLabel}` : ''}
        </Text>
      </View>

      <View style={styles.filtersShell}>
        <Text style={styles.filtersLabel}>Bộ lọc nhanh</Text>
        <ApartmentFiltersBar value={filters} onChange={setFilters} />
      </View>

      {!loading && apartments.length > 0 ? (
        <Text style={styles.resultCount}>
          Tìm thấy {apartments.length}
          {hasMore ? '+' : ''} căn hộ
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      <View style={styles.container}>
        {loading && apartments.length === 0 ? (
          <View style={styles.centered}>
            {listHeader}
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color={Brand.primary} />
              <Text style={styles.loadingText}>Đang tải căn hộ…</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={apartments}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={8}
            windowSize={7}
            removeClippedSubviews
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  void refresh();
                }}
                tintColor={Brand.primary}
                colors={[Brand.primary]}
              />
            }
            onEndReached={() => {
              void loadMore();
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.empty}>
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    {error
                      ? 'Không tải được danh sách'
                      : 'Chưa có căn phù hợp'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {error
                      ? error
                      : 'Thử đổi quận, mức giá hoặc loại phòng để xem thêm lựa chọn.'}
                  </Text>
                  {error ? (
                    <Pressable
                      onPress={() => void reload()}
                      style={({ pressed }) => [
                        styles.retryBtn,
                        pressed && styles.retryBtnPressed,
                      ]}>
                      <Text style={styles.retryBtnText}>Thử lại</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <View style={styles.footer}>
                  <ActivityIndicator color={Brand.primary} />
                </View>
              ) : !hasMore && apartments.length > 0 ? (
                <Text style={styles.footerText}>Bạn đã xem hết danh sách</Text>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: Brand.canvas,
  },
  header: {
    gap: 16,
    paddingTop: 8,
    marginBottom: 8,
  },
  greetingCard: {
    backgroundColor: Brand.surface,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    gap: 6,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: Brand.primary,
  },
  greetingTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    color: Brand.ink,
    letterSpacing: -0.6,
  },
  greetingSub: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.muted,
    fontWeight: '500',
  },
  filtersShell: {
    backgroundColor: Brand.surface,
    borderRadius: 12,
    paddingTop: 14,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    gap: 8,
  },
  filtersLabel: {
    paddingHorizontal: 16,
    fontSize: 13,
    fontWeight: '700',
    color: Brand.ink,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.muted,
    paddingHorizontal: 4,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  centered: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingBlock: {
    marginTop: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Brand.muted,
    fontWeight: '500',
  },
  empty: {
    paddingVertical: 28,
  },
  emptyCard: {
    backgroundColor: Brand.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Brand.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: Brand.muted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnPressed: {
    backgroundColor: Brand.primaryDark,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    textAlign: 'center',
    paddingVertical: 16,
    fontSize: 13,
    color: Brand.muted,
    fontWeight: '500',
  },
});
