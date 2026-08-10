import { Pressable, Text, View } from 'react-native';

import type { ApartmentFilters } from '@/lib/apartments-service';

export type SortOption = NonNullable<ApartmentFilters['sortBy']>;

const OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá ↑', value: 'price-asc' },
  { label: 'Giá ↓', value: 'price-desc' },
];

type Props = {
  value: SortOption;
  onChange: (next: SortOption) => void;
};

export function SortPills({ value, onChange }: Props) {
  return (
    <View className="gap-3.5">
      <Text className="text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
        Sắp xếp
      </Text>
      <View className="flex-row flex-wrap gap-2.5">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
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
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
