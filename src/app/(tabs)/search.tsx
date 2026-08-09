import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApartmentCard } from '@/components/apartment-card';
import { ApartmentFiltersBar } from '@/components/apartment-filters-bar';
import { useApartments } from '@/hooks/use-apartments';
import type { ApartmentFilters } from '@/lib/apartments-service';
import type { Apartment } from '@/lib/types';

const UI = {
  primary: '#1E75FF',
  ink: '#1A1A1A',
  muted: '#7A7A7A',
  canvas: '#FFFFFF',
  border: '#E8EAF0',
  searchBg: '#F3F4F6',
} as const;

const TAB_BAR_CLEARANCE = 100;

export default function SearchScreen() {
  const [search, setSearch] = useState('');
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

  const filteredApartments = useMemo(() => {
    const q = search.trim().toLowerCase();
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
  }, [apartments, search]);

  const renderItem = useCallback(
    ({ item }: { item: Apartment }) => <ApartmentCard apartment={item} />,
    [],
  );

  const keyExtractor = useCallback((item: Apartment) => item.id, []);

  const listHeader = (
    <View style={styles.header}>
      <Text style={styles.title}>Tìm kiếm</Text>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Tìm căn hộ, mã căn, quận…"
          placeholderTextColor="#A0A4AE"
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus={false}
        />
      </View>

      <View style={styles.filtersShell}>
        <ApartmentFiltersBar value={filters} onChange={setFilters} />
      </View>

      {!loading ? (
        <Text style={styles.resultCount}>
          {filteredApartments.length}
          {hasMore && !search.trim() ? '+' : ''} kết quả
        </Text>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {loading && apartments.length === 0 ? (
          <View style={styles.centered}>
            {listHeader}
            <View style={styles.loadingBlock}>
              <ActivityIndicator size="large" color={UI.primary} />
              <Text style={styles.loadingText}>Đang tải kết quả…</Text>
            </View>
          </View>
        ) : (
          <FlatList
            data={filteredApartments}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ListHeaderComponent={listHeader}
            contentContainerStyle={styles.listContent}
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
                tintColor={UI.primary}
                colors={[UI.primary]}
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
                      : search.trim() ||
                          filters.district ||
                          filters.priceRange ||
                          filters.roomType
                        ? 'Không có kết quả phù hợp'
                        : 'Chưa có căn hộ'}
                  </Text>
                  <Text style={styles.emptyBody}>
                    {error
                      ? error
                      : 'Thử đổi từ khóa, quận, khoảng giá hoặc loại phòng.'}
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
                  <ActivityIndicator color={UI.primary} />
                </View>
              ) : !hasMore && filteredApartments.length > 0 ? (
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
    backgroundColor: UI.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: UI.canvas,
  },
  header: {
    gap: 14,
    paddingTop: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '800',
    color: UI.ink,
    letterSpacing: -0.6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI.searchBg,
    borderRadius: 999,
    minHeight: 52,
    paddingHorizontal: 18,
    gap: 10,
  },
  searchIcon: {
    fontSize: 20,
    color: '#9AA0A6',
    marginTop: -1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    color: UI.ink,
    paddingVertical: 12,
  },
  filtersShell: {
    marginTop: 2,
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '600',
    color: UI.muted,
    paddingHorizontal: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: TAB_BAR_CLEARANCE,
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
    color: UI.muted,
    fontWeight: '500',
  },
  empty: {
    paddingVertical: 28,
  },
  emptyCard: {
    backgroundColor: '#FAFBFC',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: UI.border,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: UI.ink,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 20,
    color: UI.muted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnPressed: {
    opacity: 0.88,
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
    color: UI.muted,
    fontWeight: '500',
  },
});
