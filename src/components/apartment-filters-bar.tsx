import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HANOI_DISTRICTS } from '@/lib/constants';
import type { FilterState } from '@/lib/search-params';
import type { RoomType } from '@/lib/types';

type Props = {
  value: FilterState;
  onChange: (next: FilterState) => void;
  priceError?: string | null;
  showClear?: boolean;
  onClear?: () => void;
};

/** 6 quận trọng điểm — trạng thái rút gọn */
const PRIORITY_DISTRICTS = [
  'Ba Đình',
  'Tây Hồ',
  'Thanh Xuân',
  'Đống Đa',
  'Cầu Giấy',
  'Hai Bà Trưng',
] as const;

const FILTER_ROOM_TYPES: { label: string; value: RoomType }[] = [
  { label: 'Studio', value: 'studio' },
  { label: '1N1K', value: '1n1k' },
  { label: '2N1K', value: '2n1k' },
  { label: 'Khác', value: 'other' },
];

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function FilterChip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      className={`rounded-full px-4 py-2.5 ${
        selected ? 'bg-brand' : 'bg-[#F3F0E8]'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <Text
        className={`text-[13px] ${
          selected ? 'font-semibold text-white' : 'font-medium text-[#4A453E]'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

function toggleInList(list: string[], item: string): string[] {
  return list.includes(item)
    ? list.filter((v) => v !== item)
    : [...list, item];
}

export function ApartmentFiltersBar({
  value,
  onChange,
  priceError,
  showClear,
  onClear,
}: Props) {
  const [districtsExpanded, setDistrictsExpanded] = useState(false);
  const [minFocused, setMinFocused] = useState(false);
  const [maxFocused, setMaxFocused] = useState(false);

  const visibleDistricts = useMemo(() => {
    if (districtsExpanded) return [...HANOI_DISTRICTS];

    const priority = PRIORITY_DISTRICTS.filter((d) =>
      (HANOI_DISTRICTS as readonly string[]).includes(d),
    );

    const extras = value.district.filter(
      (d) =>
        !priority.includes(d as (typeof PRIORITY_DISTRICTS)[number]),
    );
    return [...priority, ...extras];
  }, [districtsExpanded, value.district]);

  return (
    <View className="gap-8">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-[22px] font-semibold tracking-tight text-foreground">
          Bộ lọc
        </Text>
        {showClear ? (
          <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
            <Text className="text-[13px] font-bold text-brand">Xóa bộ lọc</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-3.5">
        <Text className="text-[15px] font-semibold tracking-tight text-foreground">
          Khu vực
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {visibleDistricts.map((district) => (
            <FilterChip
              key={district}
              label={district}
              selected={value.district.includes(district)}
              onPress={() =>
                onChange({
                  ...value,
                  district: toggleInList(value.district, district),
                })
              }
            />
          ))}
          <Pressable
            onPress={() => {
              Keyboard.dismiss();
              setDistrictsExpanded((v) => !v);
            }}
            className="rounded-xl bg-transparent px-3.5 py-2.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <Text className="text-sm font-bold text-brand">
              {districtsExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3.5">
        <Text className="text-[15px] font-semibold tracking-tight text-foreground">
          Loại phòng
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {FILTER_ROOM_TYPES.map((type) => (
            <FilterChip
              key={type.value}
              label={type.label}
              selected={value.roomType.includes(type.value)}
              onPress={() =>
                onChange({
                  ...value,
                  roomType: toggleInList(value.roomType, type.value),
                })
              }
            />
          ))}
        </View>
      </View>

      <View className="gap-3.5">
        <Text className="text-[15px] font-semibold tracking-tight text-foreground">
          Mức giá
        </Text>
        <Text className="-mt-1.5 text-[13px] font-medium text-brand-muted">
          Đơn vị: triệu VNĐ / tháng
        </Text>
        <View className="flex-row items-center gap-2.5">
          <View
            className={`min-h-[52px] flex-1 flex-row items-center gap-1.5 rounded-2xl border bg-white px-3.5 ${
              minFocused ? 'border-brand' : 'border-[#EFECE4]'
            }`}>
            <Text className="text-[15px] font-bold text-brand-muted">₫</Text>
            <TextInput
              value={value.priceMinInput}
              onChangeText={(priceMinInput) =>
                onChange({ ...value, priceMinInput })
              }
              placeholder="Từ"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              inputMode="decimal"
              className="flex-1 py-3 text-base font-semibold text-foreground"
              onFocus={() => setMinFocused(true)}
              onBlur={() => setMinFocused(false)}
              returnKeyType="next"
            />
          </View>

          <Text className="text-lg font-bold text-brand-muted">–</Text>

          <View
            className={`min-h-[52px] flex-1 flex-row items-center gap-1.5 rounded-2xl border bg-white px-3.5 ${
              maxFocused ? 'border-brand' : 'border-[#EFECE4]'
            }`}>
            <Text className="text-[15px] font-bold text-brand-muted">₫</Text>
            <TextInput
              value={value.priceMaxInput}
              onChangeText={(priceMaxInput) =>
                onChange({ ...value, priceMaxInput })
              }
              placeholder="Đến"
              placeholderTextColor="#9CA3AF"
              keyboardType="decimal-pad"
              inputMode="decimal"
              className="flex-1 py-3 text-base font-semibold text-foreground"
              onFocus={() => setMaxFocused(true)}
              onBlur={() => setMaxFocused(false)}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        {priceError ? (
          <Text className="text-[13px] font-semibold text-red-600">
            {priceError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
