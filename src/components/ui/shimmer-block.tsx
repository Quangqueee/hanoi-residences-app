import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = {
  className?: string;
  style?: object;
  height?: number;
  width?: number | `${number}%`;
};

/** Soft pulse block used to compose skeleton UIs. */
export function ShimmerBlock({
  className,
  style,
  height,
  width = '100%',
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0.42, 0.92]),
  }));

  return (
    <Animated.View
      className={`overflow-hidden rounded-xl bg-[#E8E4D8] ${className ?? ''}`}
      style={[
        { height, width: width as number | `${number}%` },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function ApartmentCardSkeleton({
  variant = 'feed',
}: {
  variant?: 'feed' | 'rail' | 'compact';
}) {
  const isRail = variant === 'rail';
  const isCompact = variant === 'compact';

  if (isCompact) {
    return (
      <View className="mb-3 flex-row items-center gap-3.5 rounded-[16px] border border-hoteliq-line bg-white p-3">
        <ShimmerBlock className="h-[72px] w-[72px] rounded-[12px]" />
        <View className="min-w-0 flex-1 gap-2">
          <ShimmerBlock className="h-4 w-[70%] rounded-md" />
          <ShimmerBlock className="h-3 w-[55%] rounded-md" />
          <ShimmerBlock className="h-4 w-[40%] rounded-md" />
        </View>
      </View>
    );
  }

  return (
    <View
      className={`overflow-hidden rounded-[16px] border border-hoteliq-line bg-white ${
        isRail ? 'mb-0 w-[268px]' : 'mb-4 w-full'
      }`}>
      <ShimmerBlock
        className={
          isRail
            ? 'h-[168px] w-full rounded-none'
            : 'h-[210px] w-full rounded-none'
        }
      />
      <View className="gap-2.5 px-3.5 pb-4 pt-3">
        <ShimmerBlock className="h-4 w-[78%] rounded-md" />
        <ShimmerBlock className="h-3 w-[42%] rounded-md" />
        <ShimmerBlock className="mt-1 h-5 w-[55%] rounded-md" />
      </View>
    </View>
  );
}

export function ApartmentListSkeleton({
  count = 4,
  variant = 'feed',
}: {
  count?: number;
  variant?: 'feed' | 'rail';
}) {
  return (
    <View
      className={
        variant === 'rail'
          ? 'flex-row gap-3.5 px-1'
          : 'gap-0'
      }>
      {Array.from({ length: count }).map((_, i) => (
        <ApartmentCardSkeleton key={`sk-${i}`} variant={variant} />
      ))}
    </View>
  );
}
