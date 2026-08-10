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
    <View className="gap-3">
      <Text className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A29A]">
        Sắp xếp
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`min-h-10 items-center justify-center rounded-full px-4 ${
                selected ? 'bg-brand' : 'bg-[#F3F0E8]'
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
              <Text
                className={`text-[13px] ${
                  selected
                    ? 'font-semibold text-white'
                    : 'font-medium text-[#4A453E]'
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
