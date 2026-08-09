import { useRouter } from 'expo-router';
import { memo, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ImageCarousel } from '@/components/image-carousel';
import { useAuth } from '@/contexts/auth-context';
import {
  formatCommission,
  formatPriceAmount,
  formatRelativeTime,
  getApartmentDisplayTitle,
  getListingTimestamp,
  getRoomTypeLabel,
  resolveListingBadge,
} from '@/lib/apartment-display';
import { setApartmentFavorite } from '@/lib/favorites-service';
import type { Apartment } from '@/lib/types';

type Props = {
  apartment: Apartment;
  onFavoriteToggle?: (apartmentId: string, isFavorited: boolean) => void;
};

const Brand = {
  primary: '#CDA533',
  ink: '#222222',
  muted: '#6B655C',
  surface: '#FFFFFF',
  soft: '#FBF8F1',
  border: '#EBE6DA',
  commission: '#5CB85C',
  shadow: '#1A1408',
  heart: '#EF4444',
  heartIdle: '#9CA3AF',
} as const;

function ApartmentCardComponent({ apartment, onFavoriteToggle }: Props) {
  const router = useRouter();
  const { user, userData, role, isAdmin, isCollaborator } = useAuth();

  // Web card: collaborator OR admin share CTV ops UI
  const collaboratorView =
    isCollaborator || isAdmin || role === 'collaborator' || role === 'admin';

  const title = getApartmentDisplayTitle(apartment, role);
  const commissionLabel = formatCommission(apartment.commission);
  const badge = resolveListingBadge(apartment, collaboratorView);
  const timeToDisplay = getListingTimestamp(apartment);
  const images = apartment.imageUrls ?? [];

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

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        <ImageCarousel
          urls={images}
          aspectRatio={4 / 3}
          onPress={openDetail}
          showDots
          recyclingKey={apartment.id}
        />

        {collaboratorView && commissionLabel ? (
          <View style={styles.commissionBadge} pointerEvents="none">
            <Text style={styles.commissionBadgeText} numberOfLines={1}>
              HH: {commissionLabel}
            </Text>
          </View>
        ) : null}

        {!collaboratorView && badge ? (
          <View
            style={[
              styles.marketingBadge,
              { backgroundColor: badge.backgroundColor },
            ]}
            pointerEvents="none">
            <Text style={styles.marketingBadgeText}>{badge.label}</Text>
          </View>
        ) : null}

        {collaboratorView && badge ? (
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: badge.backgroundColor },
            ]}
            pointerEvents="none">
            <Text style={styles.statusBadgeText}>{badge.label}</Text>
          </View>
        ) : null}

        {apartment.sourceCode ? (
          <View style={styles.idBadge} pointerEvents="none">
            <Text style={styles.idBadgeText}>ID: {apartment.sourceCode}</Text>
          </View>
        ) : null}

        <Pressable
          onPress={toggleFavorite}
          disabled={isFavoriteUpdating}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'
          }
          style={({ pressed }) => [
            styles.heartBtn,
            (pressed || isFavoriteUpdating) && styles.heartBtnPressed,
          ]}>
          {isFavoriteUpdating ? (
            <ActivityIndicator size="small" color={Brand.heart} />
          ) : (
            <Text
              style={[
                styles.heartIcon,
                { color: isFavorite ? Brand.heart : Brand.heartIdle },
              ]}>
              {isFavorite ? '♥' : '♡'}
            </Text>
          )}
        </Pressable>
      </View>

      <Pressable
        onPress={openDetail}
        accessibilityRole="button"
        accessibilityLabel={`Xem chi tiết ${title}`}
        style={({ pressed }) => [
          styles.body,
          pressed && styles.bodyPressed,
        ]}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>

        <Text style={styles.district} numberOfLines={1}>
          {apartment.district}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaLeft} numberOfLines={1}>
            {getRoomTypeLabel(apartment.roomType)}
            {apartment.area ? ` • ${apartment.area} m²` : ''}
          </Text>
          <Text style={styles.metaRight} numberOfLines={1}>
            Cập nhật: {formatRelativeTime(timeToDisplay)}
          </Text>
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPriceAmount(apartment.price)}</Text>
          <Text style={styles.priceUnit}>/tháng</Text>
        </View>
      </Pressable>
    </View>
  );
}

export const ApartmentCard = memo(ApartmentCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: Brand.surface,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Brand.border,
    ...Platform.select({
      ios: {
        shadowColor: Brand.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
      android: { elevation: 3 },
      default: {
        shadowColor: Brand.shadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 18,
      },
    }),
  },
  imageWrap: {
    width: '100%',
    position: 'relative',
  },
  commissionBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    maxWidth: '55%',
    backgroundColor: Brand.commission,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 2,
  },
  commissionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  marketingBadge: {
    position: 'absolute',
    top: 12,
    left: 0,
    paddingLeft: 12,
    paddingRight: 16,
    paddingVertical: 6,
    zIndex: 2,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  marketingBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    paddingLeft: 12,
    paddingRight: 10,
    paddingVertical: 6,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    zIndex: 2,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  idBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(34,34,34,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 2,
  },
  idBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  heartBtn: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.16,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  heartBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  heartIcon: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 4,
  },
  bodyPressed: {
    opacity: 0.92,
  },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    color: Brand.ink,
    letterSpacing: -0.3,
  },
  district: {
    fontSize: 13,
    lineHeight: 18,
    color: Brand.muted,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metaLeft: {
    flexShrink: 1,
    fontSize: 13,
    lineHeight: 18,
    color: Brand.muted,
    fontWeight: '600',
  },
  metaRight: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: Brand.primary,
    letterSpacing: -0.4,
  },
  priceUnit: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.muted,
  },
});
