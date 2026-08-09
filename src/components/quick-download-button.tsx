import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import { downloadApartmentImages } from '@/lib/download-images';
import type { Apartment } from '@/lib/types';

type Props = {
  apartment: Apartment;
  compact?: boolean;
};

/** Brand primary from hanoiresidence.site */
const PRIMARY = '#CDA533';
const PRIMARY_DARK = '#B88E22';

export function QuickDownloadButton({ apartment, compact = false }: Props) {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    if (busy) return;
    if (!apartment.imageUrls?.length) {
      Alert.alert('Không có ảnh', 'Căn hộ này chưa có hình để tải.');
      return;
    }

    setBusy(true);
    try {
      const result = await downloadApartmentImages(apartment.imageUrls, {
        sourceCode: apartment.sourceCode,
        albumName: 'Hanoi Residences',
      });

      if (result.saved === 0) {
        Alert.alert(
          'Tải thất bại',
          'Không lưu được ảnh nào. Kiểm tra quyền thư viện ảnh và thử lại.',
        );
        return;
      }

      Alert.alert(
        'Đã lưu ảnh',
        result.failed > 0
          ? `Lưu ${result.saved}/${apartment.imageUrls.length} ảnh vào thư viện (album Hanoi Residences).`
          : `Đã lưu ${result.saved} ảnh vào album Hanoi Residences.`,
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        void onPress();
      }}
      disabled={busy}
      hitSlop={8}
      style={({ pressed }) => [
        compact ? styles.compactBtn : styles.btn,
        pressed || busy
          ? { backgroundColor: PRIMARY_DARK, opacity: 0.95 }
          : null,
      ]}>
      {busy ? (
        <ActivityIndicator size="small" color="#FFFFFF" />
      ) : (
        <Text style={styles.btnText}>
          {compact ? 'Tải ảnh nhanh' : 'Tải hình ảnh nhanh'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  compactBtn: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
