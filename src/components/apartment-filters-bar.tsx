import { useMemo, useState } from 'react';
import {
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { HANOI_DISTRICTS, ROOM_TYPES } from '@/lib/constants';
import type { FilterState } from '@/lib/search-params';

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

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Airbnb filter chip: nền trắng viền hairline, chọn = nền đen chữ trắng */
function FilterChip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={() => {
        Keyboard.dismiss();
        onPress();
      }}
      className={`min-h-11 items-center justify-center rounded-full border px-4 ${
        selected
          ? 'border-hoteliq-ink bg-hoteliq-ink'
          : 'border-hoteliq-line bg-white'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Text
        className={`text-[14px] leading-[18px] ${
          selected ? 'font-semibold text-white' : 'text-hoteliq-ink'
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
        <Text className="text-[22px] font-semibold leading-7 text-hoteliq-ink">
          Bộ lọc
        </Text>
        {showClear ? (
          <Pressable
            onPress={onClear}
            hitSlop={10}
            accessibilityRole="button"
            className="min-h-[44px] justify-center">
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              Xóa bộ lọc
            </Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-3.5">
        <Text className="text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
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
            className="min-h-11 items-center justify-center rounded-full px-3.5"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              {districtsExpanded ? 'Thu gọn' : 'Xem thêm'}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="gap-3.5">
        <Text className="text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
          Loại phòng
        </Text>
        <View className="flex-row flex-wrap gap-2.5">
          {ROOM_TYPES.map((type) => (
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
        <Text className="text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
          Mức giá
        </Text>
        <Text className="-mt-1.5 text-[13px] leading-[18px] text-hoteliq-gray">
          Đơn vị: triệu VNĐ / tháng
        </Text>
        <View className="flex-row items-center gap-2.5">
          <View
            className={`min-h-[52px] flex-1 flex-row items-center gap-1.5 rounded-[12px] border bg-white px-3.5 ${
              minFocused ? 'border-hoteliq-ink' : 'border-hoteliq-line'
            }`}>
            <Text className="text-[15px] text-hoteliq-gray">₫</Text>
            <TextInput
              value={value.priceMinInput}
              onChangeText={(priceMinInput) =>
                onChange({ ...value, priceMinInput })
              }
              placeholder="Từ"
              placeholderTextColor="#717375"
              keyboardType="decimal-pad"
              inputMode="decimal"
              className="flex-1 py-3 text-base font-semibold text-hoteliq-ink"
              onFocus={() => setMinFocused(true)}
              onBlur={() => setMinFocused(false)}
              returnKeyType="next"
            />
          </View>

          <Text className="text-lg text-hoteliq-gray">–</Text>

          <View
            className={`min-h-[52px] flex-1 flex-row items-center gap-1.5 rounded-[12px] border bg-white px-3.5 ${
              maxFocused ? 'border-hoteliq-ink' : 'border-hoteliq-line'
            }`}>
            <Text className="text-[15px] text-hoteliq-gray">₫</Text>
            <TextInput
              value={value.priceMaxInput}
              onChangeText={(priceMaxInput) =>
                onChange({ ...value, priceMaxInput })
              }
              placeholder="Đến"
              placeholderTextColor="#717375"
              keyboardType="decimal-pad"
              inputMode="decimal"
              className="flex-1 py-3 text-base font-semibold text-hoteliq-ink"
              onFocus={() => setMaxFocused(true)}
              onBlur={() => setMaxFocused(false)}
              returnKeyType="done"
              onSubmitEditing={() => Keyboard.dismiss()}
            />
          </View>
        </View>
        {priceError ? (
          <Text className="text-[13px] font-semibold text-[#C13515]">
            {priceError}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
