import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ApartmentFilters } from '@/lib/apartments-service';
import { HANOI_DISTRICTS, ROOM_TYPES } from '@/lib/constants';
import { buildPriceRangeValue, parsePriceRange } from '@/lib/format';
import type { RoomType } from '@/lib/types';

type Props = {
  value: ApartmentFilters;
  onChange: (next: ApartmentFilters) => void;
};

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

const Brand = {
  primary: '#CDA533',
  primaryDark: '#B88E22',
  ink: '#222222',
  muted: '#6B655C',
  soft: '#F5F0E6',
  surface: '#FFFFFF',
  border: '#EBE6DA',
  danger: '#B91C1C',
} as const;

function FilterChip({ label, selected, onPress }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected ? styles.chipSelected : styles.chipIdle,
        pressed && styles.chipPressed,
      ]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ApartmentFiltersBar({ value, onChange }: Props) {
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.priceRange) {
      setMinText('');
      setMaxText('');
      return;
    }
    const parsed = parsePriceRange(value.priceRange);
    setMinText(parsed.min > 0 ? String(parsed.min) : '');
    setMaxText(parsed.max === null ? '' : String(parsed.max));
  }, [value.priceRange]);

  const setDistrict = (district: string) => {
    onChange({
      ...value,
      district: value.district === district ? undefined : district,
    });
  };

  const setRoomType = (roomType: RoomType) => {
    onChange({
      ...value,
      roomType: value.roomType === roomType ? undefined : roomType,
    });
  };

  const applyCustomPrice = () => {
    const built = buildPriceRangeValue(minText, maxText);
    if (!built) {
      setApplyError('Nhập ít nhất một mức giá hợp lệ (triệu VND).');
      return;
    }
    setApplyError(null);
    onChange({
      ...value,
      priceRange: built,
    });
  };

  const clearPrice = () => {
    setMinText('');
    setMaxText('');
    setApplyError(null);
    onChange({ ...value, priceRange: undefined });
  };

  const hasActive = useMemo(
    () => !!value.district || !!value.priceRange || !!value.roomType,
    [value.district, value.priceRange, value.roomType],
  );

  return (
    <View style={styles.wrap}>
      <FilterRow label="Quận">
        {HANOI_DISTRICTS.map((district) => (
          <FilterChip
            key={district}
            label={district}
            selected={value.district === district}
            onPress={() => setDistrict(district)}
          />
        ))}
      </FilterRow>

      <View style={styles.priceSection}>
        <Text style={styles.rowLabel}>Giá (triệu VND / tháng)</Text>
        <View style={styles.customPriceBox}>
          <View style={styles.customRow}>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Từ</Text>
              <TextInput
                value={minText}
                onChangeText={(text) => {
                  setMinText(text);
                  setApplyError(null);
                }}
                placeholder="VD: 8"
                placeholderTextColor="#A8A29A"
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.input}
                returnKeyType="next"
              />
            </View>
            <Text style={styles.dash}>–</Text>
            <View style={styles.inputCol}>
              <Text style={styles.inputLabel}>Đến</Text>
              <TextInput
                value={maxText}
                onChangeText={(text) => {
                  setMaxText(text);
                  setApplyError(null);
                }}
                placeholder="VD: 15"
                placeholderTextColor="#A8A29A"
                keyboardType="decimal-pad"
                inputMode="decimal"
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={applyCustomPrice}
              />
            </View>
            <Pressable
              onPress={applyCustomPrice}
              style={({ pressed }) => [
                styles.applyBtn,
                pressed && styles.applyBtnPressed,
              ]}>
              <Text style={styles.applyBtnText}>Áp dụng</Text>
            </Pressable>
          </View>
          {applyError ? (
            <Text style={styles.errorText}>{applyError}</Text>
          ) : value.priceRange ? (
            <View style={styles.appliedRow}>
              <Text style={styles.appliedText}>
                Đang lọc: {value.priceRange.replace('-', ' → ')} triệu
              </Text>
              <Pressable onPress={clearPrice} hitSlop={6}>
                <Text style={styles.clearPriceText}>Xóa giá</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <FilterRow label="Loại phòng">
        {ROOM_TYPES.map((type) => (
          <FilterChip
            key={type.value}
            label={type.label}
            selected={value.roomType === type.value}
            onPress={() => setRoomType(type.value)}
          />
        ))}
      </FilterRow>

      {hasActive ? (
        <Pressable
          onPress={() => {
            setMinText('');
            setMaxText('');
            setApplyError(null);
            onChange({
              sortBy: value.sortBy,
            });
          }}
          style={styles.clearBtn}>
          <Text style={styles.clearText}>Xoá bộ lọc</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.chips}>
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
    paddingBottom: 8,
  },
  row: {
    gap: 6,
  },
  priceSection: {
    gap: 6,
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.muted,
  },
  chips: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipIdle: {
    backgroundColor: Brand.soft,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: Brand.primary,
    borderColor: Brand.primaryDark,
  },
  chipPressed: {
    opacity: 0.88,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Brand.ink,
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  customPriceBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: Brand.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    gap: 10,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Brand.muted,
  },
  input: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    backgroundColor: Brand.surface,
    paddingHorizontal: 10,
    fontSize: 16,
    color: Brand.ink,
    fontWeight: '600',
  },
  dash: {
    marginBottom: 10,
    fontSize: 16,
    color: Brand.muted,
    fontWeight: '700',
  },
  applyBtn: {
    minHeight: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnPressed: {
    backgroundColor: Brand.primaryDark,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    color: Brand.danger,
    fontWeight: '600',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  appliedText: {
    flex: 1,
    fontSize: 12,
    color: Brand.ink,
    fontWeight: '600',
  },
  clearPriceText: {
    fontSize: 12,
    fontWeight: '700',
    color: Brand.danger,
  },
  clearBtn: {
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: Brand.primary,
  },
});
