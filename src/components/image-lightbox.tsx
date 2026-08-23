import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewToken,
} from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppSymbol } from '@/components/app-symbol';
import { useAuth } from '@/contexts/auth-context';
import {
  formatPriceAmount,
  getApartmentDisplayTitle,
  getRoomTypeLabel,
} from '@/lib/apartment-display';
import { downloadApartmentImages } from '@/lib/download-images';
import { getDisplaySourceCode } from '@/lib/source-code';
import type { Apartment } from '@/lib/types';

type Props = {
  apartment: Apartment;
  initialIndex?: number;
  onClose: () => void;
};

const MAX_ZOOM = 4;
const ICON_BTN =
  'h-11 w-11 items-center justify-center rounded-full bg-black/45';

function ZoomableImage({
  uri,
  width,
  height,
  recyclingKey,
  isActive,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  recyclingKey: string;
  isActive: boolean;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);
  const notifiedZoom = useSharedValue(false);

  const resetZoom = useCallback(() => {
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
    notifiedZoom.value = false;
  }, [scale, savedScale, translateX, translateY, savedX, savedY, notifiedZoom]);

  useEffect(() => {
    if (!isActive) resetZoom();
  }, [isActive, resetZoom]);

  const pinch = Gesture.Pinch()
    .enabled(isActive)
    .onUpdate((event) => {
      const next = savedScale.value * event.scale;
      scale.value = Math.min(MAX_ZOOM, Math.max(1, next));
      const isZoomed = scale.value > 1.02;
      if (isZoomed !== notifiedZoom.value) {
        notifiedZoom.value = isZoomed;
        runOnJS(onZoomChange)(isZoomed);
      }
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.02) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        if (notifiedZoom.value) {
          notifiedZoom.value = false;
          runOnJS(onZoomChange)(false);
        }
      } else if (!notifiedZoom.value) {
        notifiedZoom.value = true;
        runOnJS(onZoomChange)(true);
      }
    });

  const pan = Gesture.Pan()
    .enabled(isActive)
    .manualActivation(true)
    .onTouchesMove((_event, state) => {
      if (scale.value > 1.02) {
        state.activate();
      } else {
        state.fail();
      }
    })
    .onUpdate((event) => {
      translateX.value = savedX.value + event.translationX;
      translateY.value = savedY.value + event.translationY;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .enabled(isActive)
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1.05) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
        notifiedZoom.value = false;
        runOnJS(onZoomChange)(false);
      } else {
        scale.value = withTiming(2.4);
        savedScale.value = 2.4;
        notifiedZoom.value = true;
        runOnJS(onZoomChange)(true);
      }
    });

  const composed = Gesture.Exclusive(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View
        style={[{ width, height }, animatedStyle]}
        className="items-center justify-center">
        <Image
          source={{ uri }}
          style={{ width, height }}
          contentFit="contain"
          transition={180}
          recyclingKey={recyclingKey}
          pointerEvents="none"
        />
      </Animated.View>
    </GestureDetector>
  );
}

function ChromeButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={ICON_BTN}
      style={({ pressed }) => ({ opacity: disabled || pressed ? 0.65 : 1 })}>
      {children}
    </Pressable>
  );
}

/**
 * Full-screen apartment photo viewer — port of Web `image-lightbox.tsx`.
 * Swipe to change photo, pinch / double-tap to zoom, contain (not cover).
 */
export function ImageLightbox({
  apartment,
  initialIndex = 0,
  onClose,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { role, isAdmin, isCollaborator, hasPermission } = useAuth();

  const images = useMemo(
    () => (apartment.imageUrls ?? []).filter(Boolean),
    [apartment.imageUrls],
  );
  const count = images.length;
  const startIndex = Math.max(0, Math.min(initialIndex, Math.max(count - 1, 0)));

  const listRef = useRef<FlatList<string>>(null);
  const currentIndexRef = useRef(startIndex);
  const skipDimensionScroll = useRef(true);
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [zoomed, setZoomed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);

  const canDownload = isAdmin || isCollaborator;
  const showArrows =
    count > 1 && !zoomed && (Platform.OS === 'web' || width >= 768);
  const title = getApartmentDisplayTitle(apartment, role);
  const sourceCode = canDownload
    ? getDisplaySourceCode(apartment.sourceCode, role)
    : '';
  const location = hasPermission('view_full_address')
    ? apartment.address?.trim() || `${apartment.district}, Hà Nội`
    : `${apartment.district}, Hà Nội`;
  const metaParts = [
    formatPriceAmount(apartment.price) + '/tháng',
    getRoomTypeLabel(apartment.roomType),
    apartment.area ? `${apartment.area} m²` : null,
    location,
  ].filter(Boolean);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    setZoomed(false);
  }, [currentIndex]);

  useEffect(() => {
    if (count <= 0) return;
    if (skipDimensionScroll.current) {
      skipDimensionScroll.current = false;
      return;
    }
    listRef.current?.scrollToIndex({
      index: currentIndexRef.current,
      animated: false,
    });
  }, [count, height, width]);

  const syncIndexFromOffset = useCallback(
    (offsetX: number) => {
      if (width <= 0 || count <= 0) return;
      const next = Math.round(offsetX / width);
      setCurrentIndex(Math.max(0, Math.min(next, count - 1)));
    },
    [count, width],
  );

  const onMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    syncIndexFromOffset(event.nativeEvent.contentOffset.x);
  };

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      const first = viewableItems[0];
      if (typeof first?.index === 'number') {
        setCurrentIndex(first.index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      const clamped = Math.max(0, Math.min(next, count - 1));
      listRef.current?.scrollToIndex({ index: clamped, animated: true });
      setCurrentIndex(clamped);
      setZoomed(false);
    },
    [count],
  );

  const onDownload = async () => {
    if (downloading || !count) return;
    setDownloading(true);
    setDownloadPercent(0);
    try {
      const result = await downloadApartmentImages(images, {
        sourceCode: apartment.sourceCode,
        albumName: 'Hanoi Residences',
        onProgress: (progress) => setDownloadPercent(progress.percent),
      });
      if (result.saved === 0) {
        Alert.alert(
          'Tải thất bại',
          Platform.OS === 'web'
            ? 'Tải hình ảnh nhanh chỉ khả dụng trên iOS/Android.'
            : 'Không lưu được ảnh nào. Kiểm tra quyền thư viện ảnh và thử lại.',
        );
        return;
      }
      Alert.alert(
        'Đã lưu ảnh',
        result.failed > 0
          ? `Lưu ${result.saved}/${count} ảnh vào thư viện (album Hanoi Residences).`
          : `Đã lưu ${result.saved} ảnh vào album Hanoi Residences.`,
      );
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải ảnh. Vui lòng thử lại.');
    } finally {
      setDownloading(false);
      setDownloadPercent(0);
    }
  };

  const renderItem = useCallback(
    ({ item, index }: { item: string; index: number }) => (
      <View style={{ width, height, overflow: 'hidden' }} className="items-center justify-center">
        <ZoomableImage
          uri={item}
          width={width}
          height={height}
          recyclingKey={`${apartment.id}-lightbox-${index}`}
          isActive={index === currentIndex}
          onZoomChange={setZoomed}
        />
      </View>
    ),
    [apartment.id, currentIndex, height, width],
  );

  if (count === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-black px-8">
        <StatusBar style="light" />
        <Text className="text-center text-[16px] font-medium text-white">
          Căn hộ này chưa có hình.
        </Text>
        <Pressable
          onPress={onClose}
          className="mt-5 min-h-11 items-center justify-center rounded-full bg-white px-6"
          style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink">Đóng</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar style="light" />

      <FlatList
        ref={listRef}
        data={images}
        keyExtractor={(uri, index) => `${apartment.id}-${index}-${uri}`}
        horizontal
        pagingEnabled
        scrollEnabled={!zoomed}
        showsHorizontalScrollIndicator={false}
        bounces={count > 1}
        decelerationRate="fast"
        initialScrollIndex={startIndex}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={renderItem}
        onMomentumScrollEnd={onMomentumEnd}
        onScrollEndDrag={onMomentumEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onScrollToIndexFailed={({ index }) => {
          requestAnimationFrame(() => {
            listRef.current?.scrollToIndex({ index, animated: false });
          });
        }}
        extraData={`${currentIndex}-${width}`}
        windowSize={3}
        initialNumToRender={2}
        maxToRenderPerBatch={2}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.28)', 'transparent']}
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 88,
        }}
      />

      <View
        pointerEvents="box-none"
        className="absolute left-0 right-0 top-0 z-10 flex-row items-start justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}>
        <View className="min-h-11 justify-center rounded-full bg-zinc-800/70 px-3 py-1.5">
          <Text className="text-[13px] font-semibold text-white">
            {currentIndex + 1} / {count}
            {sourceCode ? `  ·  ${sourceCode}` : ''}
          </Text>
        </View>

        <View className="flex-row items-center gap-2.5">
          {canDownload ? (
            <ChromeButton
              label="Tải tất cả ảnh"
              disabled={downloading}
              onPress={() => void onDownload()}>
              {downloading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <AppSymbol
                  name={{
                    ios: 'square.and.arrow.down',
                    android: 'file_download',
                    web: 'file_download',
                  }}
                  size={20}
                  tintColor="#FFFFFF"
                  weight="semibold"
                />
              )}
            </ChromeButton>
          ) : null}

          <ChromeButton label="Đóng" onPress={onClose}>
            <AppSymbol
              name={{
                ios: 'xmark',
                android: 'close',
                web: 'close',
              }}
              size={20}
              tintColor="#FFFFFF"
              weight="semibold"
            />
          </ChromeButton>
        </View>
      </View>

      {showArrows ? (
        <>
          <View
            pointerEvents="box-none"
            className="absolute bottom-0 top-0 z-10 justify-center pl-3"
            style={{ left: 0 }}>
            {currentIndex > 0 ? (
              <ChromeButton
                label="Ảnh trước"
                onPress={() => goTo(currentIndex - 1)}>
                <AppSymbol
                  name={{
                    ios: 'chevron.left',
                    android: 'chevron_left',
                    web: 'chevron_left',
                  }}
                  size={22}
                  tintColor="#FFFFFF"
                  weight="semibold"
                />
              </ChromeButton>
            ) : null}
          </View>
          <View
            pointerEvents="box-none"
            className="absolute bottom-0 top-0 z-10 items-end justify-center pr-3"
            style={{ right: 0 }}>
            {currentIndex < count - 1 ? (
              <ChromeButton
                label="Ảnh sau"
                onPress={() => goTo(currentIndex + 1)}>
                <AppSymbol
                  name={{
                    ios: 'chevron.right',
                    android: 'chevron_right',
                    web: 'chevron_right',
                  }}
                  size={22}
                  tintColor="#FFFFFF"
                  weight="semibold"
                />
              </ChromeButton>
            ) : null}
          </View>
        </>
      ) : null}

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.82)']}
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: insets.bottom + 128,
        }}
      />

      <View
        pointerEvents="none"
        className="absolute bottom-0 left-0 right-0 z-10 px-5"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Text
          className="text-[18px] font-semibold leading-6 text-white"
          numberOfLines={2}>
          {title}
        </Text>
        <Text
          className="mt-1 text-[13px] leading-[18px] text-white/80"
          numberOfLines={2}>
          {metaParts.join(' · ')}
        </Text>
      </View>

      {downloading ? (
        <View
          pointerEvents="none"
          className="absolute left-4 right-4 z-20 overflow-hidden rounded-[12px] bg-black/75 px-4 py-3"
          style={{ top: insets.top + 60 }}>
          <Text className="text-[13px] font-semibold text-white">
            Đang tải ảnh căn hộ xuống
          </Text>
          <Text className="mt-0.5 text-[12px] text-white/75">
            {downloadPercent}% · {count} ảnh
          </Text>
          <View className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/20">
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${downloadPercent}%` }}
            />
          </View>
        </View>
      ) : null}
    </GestureHandlerRootView>
  );
}
