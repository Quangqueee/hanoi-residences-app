import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentFiltersBar } from '@/components/apartment-filters-bar';
import { SortPills } from '@/components/sort-pills';
import { Hoteliq } from '@/constants/theme';
import {
  DEFAULT_FILTER_STATE,
  filterStateToApartmentFilters,
  hasActiveFilterState,
  stringifySearchQueryData,
  type FilterState,
  type SortOption,
} from '@/lib/search-params';

const TAB_BAR_CLEARANCE = 64;
const APPLY_BAR_HEIGHT = 76;

const searchBarShadow = Platform.select({
  ios: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  android: { elevation: 3 },
  default: {},
});

const applyBtnShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  android: { elevation: 4 },
  default: {},
});

export default function SearchFilterCenterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [filters, setFilters] = useState<FilterState>({
    ...DEFAULT_FILTER_STATE,
  });
  const [sort, setSort] = useState<SortOption>('newest');
  const [priceError, setPriceError] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () => hasActiveFilterState(filters, sort),
    [filters, sort],
  );

  const clearAll = () => {
    Keyboard.dismiss();
    setFilters({ ...DEFAULT_FILTER_STATE });
    setSort('newest');
    setPriceError(null);
  };

  const handleApply = () => {
    Keyboard.dismiss();

    const converted = filterStateToApartmentFilters(filters, sort);
    if (!converted.ok) {
      setPriceError(converted.error);
      return;
    }

    setPriceError(null);

    const payload = {
      filters,
      sort,
    };

    router.push({
      pathname: '/search-results',
      params: {
        queryData: stringifySearchQueryData(payload),
      },
    });
  };

  return (
    <View
      className="flex-1 bg-background"
      style={{ paddingTop: insets.top }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-6 pb-3 pt-3">
            <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
              Tìm kiếm
            </Text>
            {hasActiveFilters ? (
              <Pressable
                onPress={clearAll}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Xóa bộ lọc"
                className="min-h-[44px] justify-center">
                <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
                  Xóa bộ lọc
                </Text>
              </Pressable>
            ) : (
              <View className="h-5 w-16" />
            )}
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: APPLY_BAR_HEIGHT + TAB_BAR_CLEARANCE + 48,
              gap: 28,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}
            showsVerticalScrollIndicator={false}>
            <View className="gap-7">
              {/* Search pill kiểu Airbnb: viền hairline + shadow nhẹ */}
              <View
                className="min-h-[56px] flex-row items-center gap-3 rounded-full border-[0.5px] border-hoteliq-line bg-white px-5"
                style={searchBarShadow as object}>
                <SymbolView
                  name={{
                    ios: 'magnifyingglass',
                    android: 'search',
                    web: 'search',
                  }}
                  size={18}
                  tintColor={Hoteliq.ink}
                  weight="semibold"
                />
                <TextInput
                  value={filters.query}
                  onChangeText={(query) => {
                    setFilters((prev) => ({ ...prev, query }));
                    setPriceError(null);
                  }}
                  placeholder="Từ khóa: căn hộ, mã căn, quận…"
                  placeholderTextColor={Hoteliq.muted}
                  className="flex-1 py-3.5 text-[15px] leading-[22px] text-hoteliq-ink"
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                  autoCorrect={false}
                  autoCapitalize="none"
                  onSubmitEditing={handleApply}
                />
              </View>

              <ApartmentFiltersBar
                value={filters}
                onChange={(next) => {
                  setFilters(next);
                  setPriceError(null);
                }}
                priceError={priceError}
                showClear={false}
              />

              {/* <SortPills value={sort} onChange={setSort} /> */}
            </View>
          </ScrollView>

          <View
            className="absolute left-0 right-0 bg-transparent px-6 pb-2 pt-2.5"
            style={{ bottom: Math.max(insets.bottom, 10) + TAB_BAR_CLEARANCE }}>
            <Pressable
              onPress={handleApply}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem kết quả"
              className="min-h-[56px] items-center justify-center rounded-full bg-hoteliq-primary"
              style={({ pressed }) => [
                applyBtnShadow,
                pressed ? { backgroundColor: Hoteliq.primaryDark } : null,
              ]}>
              <Text className="text-[16px] font-semibold text-white">
                Xem kết quả
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
