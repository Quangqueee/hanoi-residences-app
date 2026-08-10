import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApartmentMarkdownDescription } from '@/components/apartment-markdown-description';
import { BookingModal } from '@/components/booking-modal';
import { ImageCarousel } from '@/components/image-carousel';
import { QuickDownloadButton } from '@/components/quick-download-button';
import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  formatCommission,
  formatPriceAmount,
  getApartmentDisplayTitle,
  getRoomTypeLabel,
  resolveListingBadge,
  truncateText,
  usesAiSeoContent,
} from '@/lib/apartment-display';
import { getApartmentById } from '@/lib/apartments-service';
import { setApartmentFavorite } from '@/lib/favorites-service';
import { shareApartment } from '@/lib/share-apartment';
import type { Apartment } from '@/lib/types';

const UI = {
  descriptionPreview: 160,
  bottomBarClearance: 108,
  heroRadius: 20,
} as const;

const softShadow = Platform.select({
  ios: {
    shadowColor: Hoteliq.shadow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
  },
  android: { elevation: 2 },
  default: {},
});

function getLandlordPhone(apartment: Apartment): string {
  return (
    apartment.contactPhone?.trim() ||
    apartment.landlordPhoneNumber?.trim() ||
    ''
  );
}

function buildInternalCopyText(apartment: Apartment): string {
  const phone = getLandlordPhone(apartment);
  const lines = [
    `ID: ${apartment.sourceCode || apartment.id}`,
    `Tiêu đề: ${apartment.title}`,
    `Giá: ${formatPriceAmount(apartment.price)}/tháng`,
    apartment.area ? `Diện tích: ${apartment.area} m²` : null,
    `Quận: ${apartment.district}`,
    apartment.address ? `Địa chỉ: ${apartment.address}` : null,
    phone ? `SĐT chủ nhà: ${phone}` : 'SĐT chủ nhà: —',
    '',
    '--- Mô tả gốc ---',
    apartment.details?.trim() || '(Chưa có mô tả)',
  ];
  return lines.filter((line) => line !== null).join('\n');
}

function HeaderIconButton({
  onPress,
  label,
  children,
  disabled,
}: {
  onPress: () => void;
  label: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-[12px] border border-hoteliq-line bg-white"
      style={({ pressed }) => ({
        opacity: disabled || pressed ? 0.7 : 1,
      })}>
      {children}
    </Pressable>
  );
}

export default function ApartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    userData,
    role,
    isAdmin,
    isCollaborator,
    hasPermission,
  } = useAuth();

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteUpdating, setFavoriteUpdating] = useState(false);

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
          const fav =
            typeof data.isFavorited === 'boolean'
              ? data.isFavorited
              : userData?.favorites?.includes(data.id) || false;
          setIsFavorite(fav);
        }
      } catch (err) {
        if (!active) return;
        console.error(err);
        setError('Không tải được chi tiết căn hộ.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [id, userData?.favorites]);

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-8"
        style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={Hoteliq.primary} />
        <Text className="mt-4 text-[14px] font-medium text-hoteliq-gray">
          Đang tải căn hộ…
        </Text>
      </View>
    );
  }

  if (error || !apartment) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-8"
        style={{ paddingTop: insets.top }}>
        <View
          className="w-full items-center gap-3 rounded-[16px] bg-hoteliq-chip px-7 py-10"
          style={softShadow}>
          <Text className="text-center text-[17px] font-semibold text-hoteliq-ink">
            {error ?? 'Không có dữ liệu.'}
          </Text>
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            hitSlop={8}
            className="mt-2 min-h-11 items-center justify-center rounded-[12px] bg-hoteliq-primary px-6"
            style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
            <Text className="text-sm font-semibold text-white">Quay lại</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const title = getApartmentDisplayTitle(apartment, role);
  const showAiMarkdown = usesAiSeoContent(role);
  const aiDescription =
    apartment.aiContent?.description?.trim() ||
    'Thông tin đang được cập nhật...';
  const originalDescription =
    apartment.details?.trim() || 'Thông tin đang được cập nhật...';
  const descriptionForTruncate = showAiMarkdown
    ? aiDescription
    : originalDescription;
  const showCommission = hasPermission('view_commission');
  const showFullAddress = hasPermission('view_full_address');
  const showOpsTools = isAdmin || isCollaborator;
  const commissionLabel = formatCommission(apartment.commission);
  const highlights = apartment.aiContent?.highlights ?? [];
  const collaboratorView =
    isCollaborator || isAdmin || role === 'collaborator' || role === 'admin';
  const badge = resolveListingBadge(apartment, collaboratorView);
  const landlordPhone = getLandlordPhone(apartment);
  const needsTruncate =
    descriptionForTruncate.length > UI.descriptionPreview;
  const visibleAiDescription =
    descExpanded || !needsTruncate
      ? aiDescription
      : truncateText(aiDescription, UI.descriptionPreview);
  const visibleOriginalDescription =
    descExpanded || !needsTruncate
      ? originalDescription
      : truncateText(originalDescription, UI.descriptionPreview);

  const locationLine = showFullAddress
    ? apartment.address?.trim() || `${apartment.district}, Hà Nội`
    : `${apartment.district}, Hà Nội`;

  const previewUrls = (apartment.imageUrls ?? []).slice(0, 3);

  const bookLabel = 'Booking Now';

  const onCopyApartmentInfo = async () => {
    try {
      await Clipboard.setStringAsync(buildInternalCopyText(apartment));
      Alert.alert('Thành công', 'Đã sao chép thông tin căn hộ!');
    } catch (err) {
      console.error('Copy apartment info error:', err);
      Alert.alert('Lỗi', 'Không thể sao chép. Vui lòng thử lại.');
    }
  };

  const toggleFavorite = async () => {
    if (favoriteUpdating) return;
    if (!user) {
      Alert.alert('Đăng nhập', 'Vui lòng đăng nhập để lưu căn hộ yêu thích.');
      return;
    }
    const next = !isFavorite;
    setFavoriteUpdating(true);
    setIsFavorite(next);
    try {
      await setApartmentFavorite(user.uid, apartment.id, next);
    } catch (err) {
      console.error(err);
      setIsFavorite(!next);
      Alert.alert('Không thể cập nhật', 'Vui lòng thử lại.');
    } finally {
      setFavoriteUpdating(false);
    }
  };

  const amenityChips: { icon: string; label: string }[] = [
    { icon: '⌂', label: getRoomTypeLabel(apartment.roomType) },
    {
      icon: '▣',
      label: apartment.area ? `${apartment.area} m²` : 'Flexible',
    },
    {
      icon: '★',
      label:
        badge?.label ??
        (apartment.tags?.includes('pet_friendly')
          ? 'Pet friendly'
          : apartment.status === 'available'
            ? 'Available'
            : 'Listed'),
    },
  ];

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: UI.bottomBarClearance + insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
        bounces>
        {/* Top bar */}
        <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
          <HeaderIconButton
            label="Quay lại"
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}>
            <SymbolView
              name={{
                ios: 'chevron.left',
                android: 'arrow_back_ios',
                web: 'arrow_back_ios',
              }}
              size={18}
              weight="semibold"
              tintColor={Hoteliq.ink}
            />
          </HeaderIconButton>

          <Text className="text-[16px] font-semibold text-hoteliq-ink">
            Detail
          </Text>

          <HeaderIconButton
            label="Chia sẻ"
            disabled={sharing}
            onPress={() => {
              void (async () => {
                if (sharing) return;
                setSharing(true);
                try {
                  await shareApartment(apartment, role);
                } finally {
                  setSharing(false);
                }
              })();
            }}>
            {sharing ? (
              <ActivityIndicator color={Hoteliq.primary} size="small" />
            ) : (
              <SymbolView
                name={{
                  ios: 'ellipsis',
                  android: 'more_horiz',
                  web: 'more_horiz',
                }}
                size={20}
                weight="medium"
                tintColor={Hoteliq.ink}
              />
            )}
          </HeaderIconButton>
        </View>

        <View className="gap-5 px-5">
          {/* Hero */}
          <View className="relative">
            <ImageCarousel
              urls={apartment.imageUrls ?? []}
              height={240}
              showDots
              recyclingKey={apartment.id}
              style={{
                width: '100%',
                borderRadius: UI.heroRadius,
                overflow: 'hidden',
                backgroundColor: Hoteliq.chip,
              }}
            />
            <Pressable
              onPress={() => void toggleFavorite()}
              disabled={favoriteUpdating}
              accessibilityRole="button"
              accessibilityLabel={
                isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'
              }
              className="absolute right-3 top-3 z-[4] h-9 w-9 items-center justify-center rounded-full bg-white"
              style={({ pressed }) => ({
                opacity: pressed || favoriteUpdating ? 0.85 : 1,
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
              {favoriteUpdating ? (
                <ActivityIndicator size="small" color={Hoteliq.heart} />
              ) : (
                <Text
                  className={`text-[18px] font-bold ${
                    isFavorite ? 'text-hoteliq-heart' : 'text-[#C8C8C8]'
                  }`}>
                  {isFavorite ? '♥' : '♡'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Amenity chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}>
            {amenityChips.map((chip) => (
              <View
                key={chip.label}
                className="h-10 flex-row items-center gap-2 rounded-[12px] border border-hoteliq-line bg-white px-3">
                <Text className="text-[13px]">{chip.icon}</Text>
                <Text className="text-[12px] font-semibold text-hoteliq-ink">
                  {chip.label}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Title + price */}
          <View className="gap-2">
            <View className="flex-row items-start justify-between gap-3">
              <Text
                className="min-w-0 flex-1 text-[20px] font-bold leading-7 text-hoteliq-ink"
                numberOfLines={2}>
                {title}
              </Text>
              <View className="items-end pt-0.5">
                <Text className="text-[18px] font-bold text-hoteliq-primary">
                  {formatPriceAmount(apartment.price)}
                </Text>
                <Text className="text-[12px] font-medium text-hoteliq-gray">
                  /tháng
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-1.5">
              <SymbolView
                name={{
                  ios: 'mappin.and.ellipse',
                  android: 'location_on',
                  web: 'location_on',
                }}
                size={14}
                tintColor={Hoteliq.primary}
                weight="medium"
              />
              <Text
                className="flex-1 text-[13px] font-medium leading-5 text-hoteliq-gray"
                numberOfLines={2}>
                {locationLine}
              </Text>
            </View>
          </View>

          {/* Ops meta */}
          {showCommission || showOpsTools ? (
            <View
              className="gap-2 rounded-[16px] bg-hoteliq-soft px-4 py-3.5"
              style={softShadow}>
              {showCommission ? (
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-[12px] font-semibold text-hoteliq-gray">
                    Hoa hồng
                  </Text>
                  <Text className="text-[14px] font-semibold text-[#2F7D4A]">
                    {commissionLabel ?? '—'}
                  </Text>
                </View>
              ) : null}
              {showOpsTools ? (
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="text-[12px] font-semibold text-hoteliq-gray">
                    SĐT chủ nhà
                  </Text>
                  <Text className="text-[14px] font-semibold text-hoteliq-ink">
                    {landlordPhone || '—'}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Description */}
          <View className="gap-2.5">
            <Text className="text-[16px] font-semibold text-hoteliq-ink">
              Description
            </Text>
            {showAiMarkdown ? (
              <View>
                <ApartmentMarkdownDescription content={visibleAiDescription} />
                {needsTruncate ? (
                  <Pressable
                    onPress={() => setDescExpanded((v) => !v)}
                    hitSlop={8}
                    className="mt-1 self-start">
                    <Text className="text-[13px] font-semibold text-hoteliq-primary">
                      {descExpanded ? 'Thu gọn' : 'Read More...'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View>
                <Text className="text-[13px] font-normal leading-5 text-hoteliq-gray">
                  {visibleOriginalDescription}
                </Text>
                {needsTruncate ? (
                  <Pressable
                    onPress={() => setDescExpanded((v) => !v)}
                    hitSlop={8}
                    className="mt-1 self-start">
                    <Text className="text-[13px] font-semibold text-hoteliq-primary">
                      {descExpanded ? 'Thu gọn' : 'Read More...'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>

          {showAiMarkdown && highlights.length > 0 ? (
            <View className="gap-2">
              {highlights.slice(0, 4).map((item) => (
                <View key={item} className="flex-row gap-2">
                  <Text className="text-hoteliq-primary">•</Text>
                  <Text className="flex-1 text-[13px] leading-5 text-hoteliq-gray">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Preview thumbnails */}
          {previewUrls.length > 0 ? (
            <View className="gap-3">
              <Text className="text-[16px] font-semibold text-hoteliq-ink">
                Preview
              </Text>
              <View className="flex-row gap-3">
                {previewUrls.map((uri, index) => (
                  <View
                    key={`${uri}-${index}`}
                    className="h-[72px] flex-1 overflow-hidden rounded-[12px] bg-hoteliq-chip">
                    <Image
                      source={{ uri }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      recyclingKey={`${apartment.id}-preview-${index}`}
                    />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {showOpsTools ? (
            <View className="mb-2 gap-2.5">
              <QuickDownloadButton apartment={apartment} />
              <Pressable
                onPress={() => void onCopyApartmentInfo()}
                accessibilityRole="button"
                accessibilityLabel="Sao chép thông tin căn hộ"
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-[12px] bg-hoteliq-soft px-4"
                style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
                <Text className="text-[14px] font-semibold text-hoteliq-primary">
                  Sao chép thông tin
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Sticky Booking Now */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t border-hoteliq-line bg-white px-5 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
        <Pressable
          onPress={() => setBookingOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={bookLabel}
          className="min-h-[56px] items-center justify-center rounded-[16px] bg-hoteliq-primary"
          style={({ pressed }) => [
            Platform.select({
              ios: {
                shadowColor: Hoteliq.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
              },
              android: { elevation: 4 },
              default: {},
            }),
            pressed ? { opacity: 0.9, transform: [{ scale: 0.99 }] } : null,
          ]}>
          <Text className="text-[16px] font-bold text-white">{bookLabel}</Text>
        </Pressable>
      </View>

      <BookingModal
        visible={bookingOpen}
        apartment={apartment}
        onClose={() => setBookingOpen(false)}
      />
    </View>
  );
}
