import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { ImageLightbox } from '@/components/image-lightbox';
import { getApartmentById } from '@/lib/apartments-service';
import type { Apartment } from '@/lib/types';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function clampIndex(value: string | string[] | undefined, length: number): number {
  if (length <= 0) return 0;
  const parsed = Number.parseInt(firstParam(value), 10);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.min(parsed, length - 1));
}

export default function ApartmentGalleryScreen() {
  const raw = useLocalSearchParams<{ id?: string | string[]; index?: string | string[] }>();
  const id = firstParam(raw.id);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (router.canGoBack()) router.back();
    else if (id) router.replace(`/apartment/${id}`);
    else router.replace('/(tabs)');
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!id) {
        setError('Thiếu mã căn hộ.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const data = await getApartmentById(id);
        if (!active) return;
        if (!data) {
          setError('Không tìm thấy căn hộ.');
          setApartment(null);
        } else {
          setApartment(data);
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('Không tải được ảnh căn hộ.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-black px-8"
        style={{ paddingTop: insets.top }}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#FFFFFF" />
        <Text className="mt-4 text-[14px] font-medium text-white/80">
          Đang tải ảnh…
        </Text>
      </View>
    );
  }

  if (error || !apartment) {
    return (
      <View
        className="flex-1 items-center justify-center bg-black px-8"
        style={{ paddingTop: insets.top }}>
        <StatusBar style="light" />
        <View className="w-full items-center gap-3 rounded-[12px] bg-white/10 px-7 py-10">
          <Text className="text-center text-[16px] font-semibold leading-[22px] text-white">
            {error ?? 'Không có dữ liệu.'}
          </Text>
          <Pressable
            onPress={close}
            hitSlop={8}
            className="mt-2 min-h-11 items-center justify-center rounded-full bg-white px-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <Text className="text-sm font-semibold text-hoteliq-ink">Đóng</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ImageLightbox
      apartment={apartment}
      initialIndex={clampIndex(raw.index, apartment.imageUrls?.length ?? 0)}
      onClose={close}
    />
  );
}
