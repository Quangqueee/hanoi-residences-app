import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

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

const DOT_SIZE = 6;
const DOT_ACTIVE_WIDTH = 16;
const DOT_GAP = 6;

function CarouselDot({
  index,
  progress,
}: {
  index: number;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - index);
    const width = interpolate(
      distance,
      [0, 1],
      [DOT_ACTIVE_WIDTH, DOT_SIZE],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      distance,
      [0, 1],
      [1, 0.55],
      Extrapolation.CLAMP,
    );
    return {
      width,
      opacity,
    };
  });

  return <Animated.View style={[styles.dot, style]} />;
}

/**
 * Horizontal paging carousel — tap navigates; swipe does not.
 * Works on iOS / Android / Web (Expo).
 * Dots track scroll progress (Airbnb / Hanoi Residence style).
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
  const progress = useSharedValue(0);
  const swipeScale = useSharedValue(1);

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

  useEffect(() => {
    progress.value = index;
  }, [index, progress]);

  const markDragging = () => {
    draggingRef.current = true;
    swipeScale.value = withSpring(0.985, { damping: 18, stiffness: 220 });
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  };

  const clearDraggingSoon = () => {
    swipeScale.value = withSpring(1, { damping: 16, stiffness: 200 });
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    dragTimeoutRef.current = setTimeout(() => {
      draggingRef.current = false;
    }, 80);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const offset = e.nativeEvent.contentOffset.x;
    progress.value = offset / width;
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

  const mediaStyle = useAnimatedStyle(() => ({
    transform: [{ scale: swipeScale.value }],
  }));

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
        <Animated.View style={[styles.media, mediaStyle]}>
          <ScrollView
            horizontal
            pagingEnabled
            nestedScrollEnabled
            directionalLockEnabled
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={onScroll}
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
        </Animated.View>
      ) : (
        <View style={[styles.placeholder, { height: slideHeight || height }]} />
      )}

      {showCounter && count > 0 ? (
        <View style={[styles.counter, styles.pointerNone]}>
          <Text style={styles.counterText}>
            {index + 1}/{count}
          </Text>
        </View>
      ) : null}

      {showDots && count > 1 ? (
        <View style={[styles.dots, styles.pointerNone]}>
          {images.map((_, i) => (
            <CarouselDot key={`dot-${i}`} index={i} progress={progress} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7',
  },
  placeholderText: {
    color: '#717375',
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
    gap: DOT_GAP,
  },
  pointerNone: {
    pointerEvents: 'none',
  },
  dot: {
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#FFFFFF',
    // Cross-platform CSS shadow — avoids deprecated RN Web shadow* props.
    boxShadow: '0px 1px 1.5px rgba(0,0,0,0.25)',
  },
  counter: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: 'rgba(10,10,10,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
