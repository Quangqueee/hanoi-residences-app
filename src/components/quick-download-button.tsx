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

/** Airbnb-style dark CTA */
const PRIMARY = '#0A0A0A';
const PRIMARY_DARK = '#2A2A2A';

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
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  compactBtn: {
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
