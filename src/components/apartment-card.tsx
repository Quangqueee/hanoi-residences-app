import { useRouter } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  formatRelativeTime,
  getListingTimestamp,
  getRoomTypeLabel,
  resolveListingBadge,
} from '@/lib/apartment-display';
import { setApartmentFavorite } from '@/lib/favorites-service';
import { getDisplaySourceCode } from '@/lib/source-code';
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

/** Web-safe shadow — RN Web deprecates shadow* props in favor of boxShadow. */
const overlayFavoriteShadow = {
  boxShadow: '0px 2px 6px rgba(0,0,0,0.1)',
} as const;

function FavoriteButton({
  isFavorite,
  updating,
  onPress,
  className,
  /** Overlay on image (User) vs inline in content (CTV/Admin) */
  tone = 'overlay',
}: {
  isFavorite: boolean;
  updating: boolean;
  onPress: () => void;
  className?: string;
  tone?: 'overlay' | 'inline';
}) {
  const isOverlay = tone === 'overlay';

  return (
    <Pressable
      onPress={(e) => {
        // Prevent parent card press handlers if event bubbling reaches them.
        e?.stopPropagation?.();
        onPress();
      }}
      disabled={updating}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
      className={`${
        isOverlay
          ? 'z-[4] h-9 w-9 items-center justify-center rounded-full bg-white'
          : 'z-[4] h-8 w-8 items-center justify-center'
      } ${className ?? ''}`}
      style={({ pressed }) => ({
        opacity: pressed || updating ? 0.85 : 1,
        ...(isOverlay ? overlayFavoriteShadow : {}),
      })}>
      {updating ? (
        <ActivityIndicator size="small" color={Hoteliq.heart} />
      ) : (
        <Text
          className={`font-bold leading-5 ${
            isOverlay ? 'text-[18px]' : 'text-[20px]'
          } ${isFavorite ? 'text-hoteliq-heart' : 'text-[#C8C8C8]'}`}>
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

  // Match website card: always short listing title (never SEO title).
  const title = apartment.title?.trim() || 'Căn hộ';
  const commissionLabel = formatCommission(apartment.commission);
  const badge = resolveListingBadge(apartment, collaboratorView);
  const images = apartment.imageUrls ?? [];
  const cover = images[0];
  const districtLine = apartment.district?.trim() || 'Hà Nội';
  const roomMeta = [
    getRoomTypeLabel(apartment.roomType),
    apartment.area != null ? `${apartment.area} m²` : null,
  ]
    .filter(Boolean)
    .join(' • ');
  const updatedLabel = formatRelativeTime(getListingTimestamp(apartment));

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
        className={`mb-3 flex-row items-center gap-3.5 rounded-[12px] border border-hoteliq-line bg-white p-3 ${className ?? ''}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}>
        <View className="h-[72px] w-[72px] overflow-hidden rounded-[10px] bg-hoteliq-chip">
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

        <View className="min-w-0 flex-1 gap-0.5">
          <Text
            className="text-[15px] font-semibold leading-5 text-hoteliq-ink"
            numberOfLines={1}>
            {title}
          </Text>
          <Text
            className="text-[12px] font-medium leading-4 text-hoteliq-gray"
            numberOfLines={1}>
            {districtLine}
          </Text>
          {roomMeta ? (
            <Text
              className="text-[12px] leading-4 text-hoteliq-gray"
              numberOfLines={1}>
              {roomMeta}
            </Text>
          ) : null}
          <View className="mt-0.5 flex-row items-baseline gap-1">
            <Text className="text-[15px] font-semibold leading-5 text-hoteliq-ink">
              {formatPriceAmount(apartment.price)}
            </Text>
            <Text className="text-[12px] text-hoteliq-gray">/tháng</Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View
      className={`${isRail ? 'mb-0 w-[280px]' : 'mb-7 w-full'} ${className ?? ''}`}>
      {/* 1. Ảnh + overlays */}
      <View className="relative w-full overflow-hidden rounded-[12px] bg-hoteliq-chip">
        <ImageCarousel
          urls={images}
          aspectRatio={isRail ? 16 / 11 : 4 / 3}
          onPress={openDetail}
          showDots
          recyclingKey={apartment.id}
          style={{
            width: '100%',
            borderRadius: 12,
            backgroundColor: Hoteliq.chip,
          }}
        />

        {/* 2. Hoa hồng (CTV/Admin) */}
        {collaboratorView && commissionLabel ? (
          <View
            className="absolute left-3 top-3 z-[2] max-w-[52%] rounded-md bg-brand-commission px-2.5 py-1"
            style={{ pointerEvents: 'none' }}>
            <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
              HH: {commissionLabel}
            </Text>
          </View>
        ) : null}

        {/* Marketing badge (User/Landlord) */}
        {!collaboratorView && badge ? (
          <View
            className="absolute left-0 top-3 z-[2] py-1.5 pl-3 pr-4"
            style={{
              backgroundColor: badge.backgroundColor,
              pointerEvents: 'none',
            }}>
            <Text className="text-[10px] font-bold uppercase tracking-wide text-white">
              {badge.label}
            </Text>
          </View>
        ) : null}

        {/* Trạng thái phòng (CTV/Admin) */}
        {collaboratorView && badge ? (
          <View
            className="absolute bottom-8 left-0 z-[2] rounded-r-md py-1.5 pl-3 pr-2.5"
            style={{
              backgroundColor: badge.backgroundColor,
              pointerEvents: 'none',
            }}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-white">
              {badge.label}
            </Text>
          </View>
        ) : null}

        {/* Mã nguồn — CTV/Admin (website card ID badge) */}
        {collaboratorView && apartment.sourceCode ? (
          <View
            className="absolute right-3 top-3 z-[2] max-w-[42%] rounded-md bg-black/60 px-2 py-1"
            style={{ pointerEvents: 'none' }}>
            <Text className="text-[11px] font-bold text-white" numberOfLines={1}>
              ID: {getDisplaySourceCode(apartment.sourceCode, role)}
            </Text>
          </View>
        ) : null}

        {/* Favorite on image — User/Landlord only (sibling of carousel, not nested) */}
        {!collaboratorView ? (
          <FavoriteButton
            isFavorite={isFavorite}
            updating={isFavoriteUpdating}
            onPress={() => void toggleFavorite()}
            tone="overlay"
            className="absolute right-3 top-3"
          />
        ) : null}
      </View>

      {/*
        Content block: openDetail Pressable must NOT wrap FavoriteButton.
        Nested <button> (RN Web) was the Home crash root cause for CTV/Admin.
      */}
      <View className={isRail ? 'pt-2.5' : 'pt-3'}>
        <Pressable
          onPress={openDetail}
          accessibilityRole="button"
          accessibilityLabel={`Xem chi tiết ${title}`}
          className="gap-0.5 active:opacity-90">
          {/* 3. Tiêu đề */}
          <Text
            className={`font-semibold text-hoteliq-ink ${
              isRail ? 'text-[14px] leading-[18px]' : 'text-[16px] leading-5'
            }`}
            numberOfLines={1}>
            {title}
          </Text>

          {/* 4. Khu vực */}
          <Text
            className={`text-hoteliq-gray ${
              isRail ? 'text-[12px] leading-4' : 'text-[13px] leading-[18px]'
            }`}
            numberOfLines={1}>
            {districtLine}
          </Text>

          {/* 5. Loại phòng + diện tích */}
          {roomMeta ? (
            <Text
              className={`font-medium text-hoteliq-gray ${
                isRail ? 'text-[12px] leading-4' : 'text-[13px] leading-[18px]'
              }`}
              numberOfLines={1}>
              {roomMeta}
            </Text>
          ) : null}

          {/* 6. Giá */}
          <View
            className={`${isRail ? 'mt-1' : 'mt-1.5'} flex-row items-baseline`}>
            <Text
              className={`font-bold text-hoteliq-ink ${
                isRail ? 'text-[15px] leading-5' : 'text-[17px] leading-6'
              }`}>
              {formatPriceAmount(apartment.price)}
            </Text>
            <Text
              className={`ml-1 font-medium text-hoteliq-gray ${
                isRail ? 'text-[12px]' : 'text-[13px]'
              }`}>
              /tháng
            </Text>
          </View>
        </Pressable>

        {/* 7. Ngày cập nhật + Favorite — Favorite is a SIBLING, never nested */}
        <View className="mt-1.5 flex-row items-center justify-between gap-2">
          <Pressable
            onPress={openDetail}
            accessibilityRole="button"
            accessibilityLabel={`Xem chi tiết ${title}`}
            className="min-w-0 flex-1 active:opacity-90">
            <Text
              className={`italic text-hoteliq-gray ${
                isRail ? 'text-[11px] leading-4' : 'text-[12px] leading-4'
              }`}
              numberOfLines={1}>
              Cập nhật: {updatedLabel}
            </Text>
          </Pressable>

          {collaboratorView ? (
            <FavoriteButton
              isFavorite={isFavorite}
              updating={isFavoriteUpdating}
              onPress={() => void toggleFavorite()}
              tone="inline"
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export const ApartmentCard = memo(ApartmentCardComponent);
