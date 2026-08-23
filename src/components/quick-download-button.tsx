import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { Hoteliq, HoteliqShadow } from '@/constants/theme';
import { downloadApartmentImages } from '@/lib/download-images';
import type { Apartment } from '@/lib/types';

type Props = {
  apartment: Apartment;
};

export function QuickDownloadButton({ apartment }: Props) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [percent, setPercent] = useState(0);
  const [toastVisible, setToastVisible] = useState(false);
  const total = apartment.imageUrls?.filter(Boolean).length ?? 0;

  const onPress = async () => {
    if (busy) return;
    if (!total) {
      Alert.alert('Không có ảnh', 'Căn hộ này chưa có hình để tải.');
      return;
    }

    setBusy(true);
    setPercent(0);
    try {
      const result = await downloadApartmentImages(apartment.imageUrls, {
        sourceCode: apartment.sourceCode,
        albumName: 'Hanoi Residences',
        onProgress: (progress) => {
          setToastVisible(true);
          setPercent(progress.percent);
        },
      });

      setToastVisible(false);

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
          ? `Lưu ${result.saved}/${total} ảnh vào thư viện (album Hanoi Residences).`
          : `Đã lưu ${result.saved} ảnh vào album Hanoi Residences.`,
      );
    } catch (error) {
      console.error(error);
      setToastVisible(false);
      Alert.alert('Lỗi', 'Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setBusy(false);
      setPercent(0);
    }
  };

  return (
    <>
      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          void onPress();
        }}
        disabled={busy}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Tải ảnh căn hộ"
        className="h-11 w-11 items-center justify-center overflow-visible rounded-full bg-white"
        style={({ pressed }) => [
          HoteliqShadow as object,
          { opacity: busy || pressed ? 0.75 : 1 },
        ]}>
        {busy ? (
          <ActivityIndicator size="small" color={Hoteliq.ink} />
        ) : (
          <AppSymbol
            name={{
              ios: 'square.and.arrow.down',
              android: 'file_download',
              web: 'file_download',
            }}
            size={18}
            tintColor={Hoteliq.ink}
            weight="semibold"
          />
        )}
      </Pressable>

      <Modal
        visible={toastVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => undefined}>
        <View
          pointerEvents="none"
          className="flex-1 px-4"
          style={{ paddingTop: insets.top + 10 }}>
          <View className="overflow-hidden rounded-[12px] bg-hoteliq-ink px-4 py-3">
            <View className="flex-row items-center gap-3">
              <ActivityIndicator color="#FFFFFF" />
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-semibold text-white">
                  Đang tải ảnh căn hộ xuống
                </Text>
                <Text className="mt-0.5 text-[12px] text-white/80">
                  {percent}% · {total} ảnh
                </Text>
              </View>
            </View>
            <View className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20">
              <View
                className="h-full rounded-full bg-white"
                style={{ width: `${percent}%` }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
