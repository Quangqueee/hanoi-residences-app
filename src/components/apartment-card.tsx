import { useRouter } from 'expo-router';
import { memo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { ImageCarousel } from '@/components/image-carousel';
import { QuickDownloadButton } from '@/components/quick-download-button';
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
import type { Apartment } from '@/lib/types';

type Props = {
  apartment: Apartment;
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
} as const;

function ApartmentCardComponent({ apartment }: Props) {
  const router = useRouter();
  const { role, isAdmin, isCollaborator } = useAuth();

  // Web card: collaborator OR admin share CTV ops UI
  const collaboratorView =
    isCollaborator || isAdmin || role === 'collaborator' || role === 'admin';

  const title = getApartmentDisplayTitle(apartment, role);
  const commissionLabel = formatCommission(apartment.commission);
  const badge = resolveListingBadge(apartment, collaboratorView);
  const timeToDisplay = getListingTimestamp(apartment);
  const images = apartment.imageUrls ?? [];

  const openDetail = () => {
    router.push(`/apartment/${apartment.id}`);
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

      {collaboratorView ? (
        <View style={styles.opsRow}>
          <QuickDownloadButton apartment={apartment} compact />
        </View>
      ) : null}
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
  opsRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Brand.soft,
    flexDirection: 'row',
  },
});
