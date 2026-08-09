import { Image } from 'expo-image';
import { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = {
  urls: string[];
  /** Fixed height (detail). Prefer this OR aspectRatio. */
  height?: number;
  aspectRatio?: number;
  onPress?: () => void;
  showDots?: boolean;
  /** e.g. "1/5" overlay */
  showCounter?: boolean;
  recyclingKey?: string;
  style?: StyleProp<ViewStyle>;
  placeholderLabel?: string;
};

/**
 * Horizontal paging carousel — tap navigates; swipe does not.
 * Works on iOS / Android / Web (Expo).
 */
export function ImageCarousel({
  urls,
  height = 320,
  aspectRatio,
  onPress,
  showDots = true,
  showCounter = false,
  recyclingKey,
  style,
  placeholderLabel = 'Chưa có ảnh',
}: Props) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const draggingRef = useRef(false);
  const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const images = urls.filter(Boolean);
  const count = images.length;
  const slideHeight =
    aspectRatio && width > 0 ? Math.round(width / aspectRatio) : height;

  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const next = Math.round(e.nativeEvent.layout.width);
      if (next > 0 && next !== width) setWidth(next);
    },
    [width],
  );

  const markDragging = () => {
    draggingRef.current = true;
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  };

  const clearDraggingSoon = () => {
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      draggingRef.current = false;
    }, 80);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(next, Math.max(count - 1, 0))));
    clearDraggingSoon();
  };

  const handleTap = () => {
    if (draggingRef.current) return;
    onPress?.();
  };

  if (count === 0) {
    return (
      <Pressable
        onPress={handleTap}
        style={[
          styles.wrap,
          aspectRatio ? { aspectRatio } : { height },
          style,
        ]}
        accessibilityRole={onPress ? 'button' : undefined}>
        <View style={[styles.placeholder, { height: '100%' }]}>
          <Text style={styles.placeholderText}>{placeholderLabel}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.wrap,
        aspectRatio ? { aspectRatio } : { height: slideHeight },
        style,
      ]}
      onLayout={onLayout}>
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={markDragging}
          onMomentumScrollBegin={markDragging}
          onScrollEndDrag={onScrollEnd}
          onMomentumScrollEnd={onScrollEnd}>
          {images.map((uri, i) => (
            <Pressable
              key={`${recyclingKey ?? 'img'}-${i}-${uri}`}
              onPress={handleTap}
              style={{ width, height: slideHeight }}
              accessibilityRole={onPress ? 'button' : undefined}>
              <Image
                source={{ uri }}
                style={{ width, height: slideHeight }}
                contentFit="cover"
                transition={200}
                recyclingKey={`${recyclingKey ?? 'carousel'}-${i}`}
              />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.placeholder, { height: slideHeight || height }]} />
      )}

      {showCounter && count > 0 ? (
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>
            {index + 1}/{count}
          </Text>
        </View>
      ) : null}

      {showDots && count > 1 ? (
        <View style={styles.dots} pointerEvents="none">
          {images.map((_, i) => (
            <View
              key={`dot-${i}`}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#F5F0E6',
    overflow: 'hidden',
    position: 'relative',
  },
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E6',
  },
  placeholderText: {
    color: '#6B655C',
    fontSize: 14,
    fontWeight: '500',
  },
  dots: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  counter: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(34,34,34,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
