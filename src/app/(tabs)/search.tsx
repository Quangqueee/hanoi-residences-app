import { useRouter } from 'expo-router';
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
import {
  DEFAULT_FILTER_STATE,
  filterStateToApartmentFilters,
  hasActiveFilterState,
  stringifySearchQueryData,
  type FilterState,
  type SortOption,
} from '@/lib/search-params';

const Brand = {
  primary: '#CDA533',
  primaryDark: '#B88E22',
} as const;

const TAB_BAR_CLEARANCE = 64;
const APPLY_BAR_HEIGHT = 76;

const applyBtnShadow = Platform.select({
  ios: {
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
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
          <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
            <Text className="text-[30px] font-semibold tracking-tight text-foreground">
              Tìm kiếm
            </Text>
            {hasActiveFilters ? (
              <Pressable
                onPress={clearAll}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Xóa bộ lọc">
                <Text className="text-[13px] font-semibold text-brand">
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
              paddingHorizontal: 20,
              paddingBottom: APPLY_BAR_HEIGHT + TAB_BAR_CLEARANCE + 48,
              gap: 28,
            }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}
            showsVerticalScrollIndicator={false}>
            <View className="gap-7">
              <View
                className="min-h-[56px] flex-row items-center gap-3 rounded-full bg-white px-5"
                style={
                  Platform.select({
                    ios: {
                      shadowColor: '#1A1408',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.05,
                      shadowRadius: 16,
                    },
                    android: { elevation: 2 },
                    default: {},
                  }) as object
                }>
                <Text className="text-xl text-[#B0AAA0]">⌕</Text>
                <TextInput
                  value={filters.query}
                  onChangeText={(query) => {
                    setFilters((prev) => ({ ...prev, query }));
                    setPriceError(null);
                  }}
                  placeholder="Từ khóa: căn hộ, mã căn, quận…"
                  placeholderTextColor="#A8A29A"
                  className="flex-1 py-3.5 text-[15px] leading-[22px] text-foreground"
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

              <SortPills value={sort} onChange={setSort} />
            </View>
          </ScrollView>

          <View
            className="absolute left-0 right-0 bg-transparent px-5 pb-2 pt-2.5"
            style={{ bottom: Math.max(insets.bottom, 10) + TAB_BAR_CLEARANCE }}>
            <Pressable
              onPress={handleApply}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="Xem kết quả"
              className="min-h-[56px] items-center justify-center rounded-full bg-brand"
              style={({ pressed }) => [
                applyBtnShadow,
                pressed ? { backgroundColor: Brand.primaryDark } : null,
              ]}>
              <Text className="text-[15px] font-semibold text-white">
                Xem kết quả
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
