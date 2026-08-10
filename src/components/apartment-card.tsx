import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';

import { ImageCarousel } from '@/components/image-carousel';
import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  formatCommission,
  formatPriceAmount,
  getApartmentDisplayTitle,
  getRoomTypeLabel,
  resolveListingBadge,
} from '@/lib/apartment-display';
import { setApartmentFavorite } from '@/lib/favorites-service';
import type { Apartment } from '@/lib/types';
import { Image } from 'expo-image';

type Props = {
  apartment: Apartment;
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
  /**
   * `rail` — Hoteliq “Near Location” wide card
   * `compact` — Hoteliq “Popular” horizontal row
   * `feed` — full-width list card
   */
  variant?: 'feed' | 'rail' | 'compact';
  className?: string;
};

const cardShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
  },
  android: { elevation: 3 },
  default: {},
});

function FavoriteButton({
  isFavorite,
  updating,
  onPress,
  className,
}: {
  isFavorite: boolean;
  updating: boolean;
  onPress: () => void;
  className?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={updating}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`z-[4] h-9 w-9 items-center justify-center rounded-full bg-white ${className ?? ''}`}
      style={({ pressed }) => ({
        opacity: pressed || updating ? 0.85 : 1,
        ...(Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
          },
          android: { elevation: 2 },
          default: {},
        }) as object),
      })}>
      {updating ? (
        <ActivityIndicator size="small" color={Hoteliq.heart} />
      ) : (
        <Text
          className={`text-[18px] font-bold leading-5 ${
            isFavorite ? 'text-hoteliq-heart' : 'text-[#C8C8C8]'
          }`}>
          {isFavorite ? '♥' : '♡'}
        </Text>
      )}
    </Pressable>
  );
}

function ApartmentCardComponent({
  apartment,
  onFavoriteToggle,
  variant = 'feed',
  className,
}: Props) {
  const isRail = variant === 'rail';
  const isCompact = variant === 'compact';
  const router = useRouter();
  const { user, userData, role, isAdmin, isCollaborator } = useAuth();

  const collaboratorView =
    isCollaborator || isAdmin || role === 'collaborator' || role === 'admin';

  const title = getApartmentDisplayTitle(apartment, role);
  const commissionLabel = formatCommission(apartment.commission);
  const badge = resolveListingBadge(apartment, collaboratorView);
  const images = apartment.imageUrls ?? [];
  const cover = images[0];
  const locationLine =
    apartment.address?.trim() ||
    `${apartment.district}, Hà Nội`;

  const initialFavoriteState =
    typeof apartment.isFavorited === 'boolean'
      ? apartment.isFavorited
      : userData?.favorites?.includes(apartment.id) || false;

  const [isFavorite, setIsFavorite] = useState(initialFavoriteState);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);

  useEffect(() => {
    const nextFavoriteState =
      typeof apartment.isFavorited === 'boolean'
        ? apartment.isFavorited
        : userData?.favorites?.includes(apartment.id) || false;
    setIsFavorite(nextFavoriteState);
  }, [apartment.id, apartment.isFavorited, userData?.favorites]);

  const openDetail = () => {
    router.push(`/apartment/${apartment.id}`);
  };

  const toggleFavorite = async () => {
    if (isFavoriteUpdating) return;
    if (!user) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để lưu căn hộ yêu thích.');
      return;
    }

    const nextIsFavorite = !isFavorite;
    setIsFavoriteUpdating(true);
    setIsFavorite(nextIsFavorite);
    onFavoriteToggle?.(apartment.id, nextIsFavorite);

    try {
      await setApartmentFavorite(user.uid, apartment.id, nextIsFavorite);
    } catch (err) {
      console.error('toggleFavorite error:', err);
      setIsFavorite(!nextIsFavorite);
      onFavoriteToggle?.(apartment.id, !nextIsFavorite);
      Alert.alert(
        'Không thể cập nhật',
        'Không lưu được trạng thái yêu thích. Vui lòng thử lại.',
      );
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  if (isCompact) {
    return (
      <Pressable
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${title}`}
        className={`mb-3 flex-row items-center gap-3.5 rounded-[16px] bg-white p-3 ${className ?? ''}`}
        style={({ pressed }) => [
          cardShadow,
          { opacity: pressed ? 0.92 : 1 },
        ]}>
        <View className="h-[72px] w-[72px] overflow-hidden rounded-[12px] bg-hoteliq-chip">
          {cover ? (
            <Image
              source={{ uri: cover }}
              style={{ width: 72, height: 72 }}
              contentFit="cover"
              recyclingKey={`${apartment.id}-compact`}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-[11px] text-hoteliq-gray">No photo</Text>
            </View>
          )}
        </View>

        <View className="min-w-0 flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-hoteliq-ink"
              numberOfLines={1}>
              {title}
            </Text>
            <View className="flex-row items-center gap-1 pt-0.5">
              <Text className="text-[12px] text-hoteliq-star">★</Text>
              <Text className="text-[12px] font-semibold text-hoteliq-ink">
                {getRoomTypeLabel(apartment.roomType)}
              </Text>
            </View>
          </View>
          <Text
            className="text-[12px] font-medium leading-4 text-hoteliq-gray"
            numberOfLines={1}>
            {locationLine}
          </Text>
          <View className="mt-0.5 flex-row items-baseline gap-1">
            <Text className="text-[15px] font-bold leading-5 text-hoteliq-primary">
              {formatPriceAmount(apartment.price)}
            </Text>
            <Text className="text-[12px] font-medium text-hoteliq-gray">
              /tháng
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      className={`overflow-hidden rounded-[16px] bg-white ${
        isRail ? 'mb-0 w-[280px]' : 'mb-4 w-full'
      } ${className ?? ''}`}
      style={cardShadow as object}>
      <View className="relative w-full">
        <ImageCarousel
          urls={images}
          aspectRatio={isRail ? 16 / 11 : 4 / 3}
          onPress={openDetail}
          showDots
          recyclingKey={apartment.id}
          style={{
            width: '100%',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            backgroundColor: Hoteliq.chip,
          }}
        />

        {collaboratorView && commissionLabel ? (
          <View
            className="absolute left-3 top-3 z-[2] max-w-[55%] rounded-full bg-brand-commission/95 px-3 py-1.5"
            pointerEvents="none">
            <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
              HH: {commissionLabel}
            </Text>
          </View>
        ) : null}

        {!collaboratorView && badge ? (
          <View
            className="absolute left-0 top-3 z-[2] rounded-r-full py-1.5 pl-3.5 pr-4"
            style={{ backgroundColor: badge.backgroundColor }}
            pointerEvents="none">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-white">
              {badge.label}
            </Text>
          </View>
        ) : null}

        {collaboratorView && badge ? (
          <View
            className="absolute bottom-8 left-0 z-[2] rounded-r-full py-1.5 pl-3.5 pr-3"
            style={{ backgroundColor: badge.backgroundColor }}
            pointerEvents="none">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-white">
              {badge.label}
            </Text>
          </View>
        ) : null}

        <FavoriteButton
          isFavorite={isFavorite}
          updating={isFavoriteUpdating}
          onPress={() => void toggleFavorite()}
          className="absolute right-3 top-3"
        />
      </View>

      <Pressable
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${title}`}
        className={`gap-1.5 active:opacity-90 ${
          isRail ? 'px-3.5 pb-4 pt-3' : 'px-4 pb-4 pt-3.5'
        }`}>
        <View className="flex-row items-start justify-between gap-2">
          <Text
            className={`min-w-0 flex-1 font-semibold tracking-tight text-hoteliq-ink ${
              isRail ? 'text-[15px] leading-5' : 'text-[16px] leading-[22px]'
            }`}
            numberOfLines={1}>
            {title}
          </Text>
          <View className="flex-row items-center gap-1 pt-0.5">
            <Text className="text-[12px] text-hoteliq-star">★</Text>
            <Text className="text-[12px] font-semibold text-hoteliq-ink">
              {apartment.area ? `${apartment.area}` : '—'}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-1">
          <SymbolView
            name={{
              ios: 'mappin.and.ellipse',
              android: 'location_on',
              web: 'location_on',
            }}
            size={12}
            tintColor={Hoteliq.muted}
            weight="medium"
          />
          <Text
            className="flex-1 text-[12px] font-medium leading-4 text-hoteliq-gray"
            numberOfLines={1}>
            {locationLine}
          </Text>
        </View>

        <View className="mt-1 flex-row items-baseline gap-1">
          <Text
            className={`font-bold tracking-tight text-hoteliq-primary ${
              isRail ? 'text-[16px] leading-5' : 'text-[18px] leading-6'
            }`}>
            {formatPriceAmount(apartment.price)}
          </Text>
          <Text className="text-[12px] font-medium text-hoteliq-gray">
            /tháng
          </Text>
        </View>
      </Pressable>
    </View>
  );
}

export const ApartmentCard = memo(ApartmentCardComponent);
