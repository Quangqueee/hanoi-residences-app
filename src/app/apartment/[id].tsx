import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SymbolView } from 'expo-symbols';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ApartmentMarkdownDescription } from '@/components/apartment-markdown-description';
import { BookingModal } from '@/components/booking-modal';
import { ImageCarousel } from '@/components/image-carousel';
import { QuickDownloadButton } from '@/components/quick-download-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
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
import { shareApartment } from '@/lib/share-apartment';
import type { Apartment } from '@/lib/types';

const UI = {
  primary: '#1E75FF',
  price: '#23D19E',
  star: '#FFD600',
  ink: '#1A1A1A',
  muted: '#7A7A7A',
  facilityBg: '#F3F5F9',
  facilityIcon: '#5B6472',
  heroRadius: 32,
  descriptionPreview: 220,
  bottomBarClearance: 110,
} as const;

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

export default function ApartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    role,
    isAdmin,
    isCollaborator,
    hasPermission,
  } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);

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
        setError('Không tải được chi tiết căn hộ.');
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
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </ThemedView>
    );
  }

  if (error || !apartment) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText type="default">{error ?? 'Không có dữ liệu.'}</ThemedText>
      </ThemedView>
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

  const bookLabel = isAdmin
    ? 'Đặt lịch'
    : isCollaborator
      ? 'Đặt lịch dẫn'
      : 'Đặt lịch xem';

  const onCopyApartmentInfo = async () => {
    try {
      await Clipboard.setStringAsync(buildInternalCopyText(apartment));
      Alert.alert('Thành công', 'Đã sao chép thông tin căn hộ!');
    } catch (err) {
      console.error('Copy apartment info error:', err);
      Alert.alert('Lỗi', 'Không thể sao chép. Vui lòng thử lại.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces>
        <SafeAreaView edges={['top']} style={styles.topSafe}>
          <View style={styles.heroWrap}>
            <ImageCarousel
              urls={apartment.imageUrls ?? []}
              height={340}
              showDots
              showCounter
              recyclingKey={apartment.id}
              style={styles.hero}
            />

            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Quay lại"
              hitSlop={8}
              style={({ pressed }) => [
                styles.backBtn,
                { opacity: pressed ? 0.75 : 1 },
              ]}>
              <SymbolView
                name={{
                  ios: 'chevron.left',
                  android: 'arrow_back_ios',
                  web: 'arrow_back_ios',
                }}
                size={18}
                weight="semibold"
                tintColor={UI.ink}
              />
            </Pressable>

            <Pressable
              onPress={async () => {
                if (sharing) return;
                setSharing(true);
                try {
                  await shareApartment(apartment, role);
                } finally {
                  setSharing(false);
                }
              }}
              disabled={sharing}
              accessibilityRole="button"
              accessibilityLabel="Chia sẻ căn hộ"
              style={({ pressed }) => [
                styles.shareBtn,
                { opacity: pressed || sharing ? 0.7 : 1 },
              ]}>
              {sharing ? (
                <ActivityIndicator color={UI.primary} size="small" />
              ) : (
                <SymbolView
                  name={{
                    ios: 'square.and.arrow.up',
                    android: 'share',
                    web: 'share',
                  }}
                  size={18}
                  weight="medium"
                  tintColor={UI.primary}
                />
              )}
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={2}>
                {title}
              </Text>
            </View>

            <View style={styles.districtRow}>
              <Text style={styles.star}>★</Text>
              <Text style={styles.districtText} numberOfLines={1}>
                {apartment.district}
                {apartment.sourceCode ? `  ·  ID ${apartment.sourceCode}` : ''}
              </Text>
            </View>

            {showFullAddress && apartment.address ? (
              <Text style={styles.fullAddress}>Địa chỉ: {apartment.address}</Text>
            ) : null}

            {showCommission ? (
              <Text style={styles.commission}>
                Hoa hồng: {commissionLabel ?? '—'}
              </Text>
            ) : null}

            {showOpsTools ? (
              <Text style={styles.landlordPhone}>
                SĐT chủ nhà: {landlordPhone || '—'}
              </Text>
            ) : null}

            {showAiMarkdown ? (
              <View style={styles.descBlock}>
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Thông tin căn hộ
                </ThemedText>
                <ApartmentMarkdownDescription content={visibleAiDescription} />
                {needsTruncate ? (
                  <Pressable
                    onPress={() => setDescExpanded((v) => !v)}
                    hitSlop={6}
                    style={styles.readMoreRow}>
                    <Text style={styles.readMore}>
                      {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                    <Text style={styles.readMoreChevron}>
                      {descExpanded ? '▴' : '▾'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.descBlock}>
                <ThemedText type="smallBold" style={styles.sectionLabel}>
                  Mô tả gốc (Bản nội bộ)
                </ThemedText>
                <Text style={styles.description}>
                  {visibleOriginalDescription}
                </Text>
                {needsTruncate ? (
                  <Pressable
                    onPress={() => setDescExpanded((v) => !v)}
                    hitSlop={6}
                    style={styles.readMoreRow}>
                    <Text style={styles.readMore}>
                      {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                    </Text>
                    <Text style={styles.readMoreChevron}>
                      {descExpanded ? '▴' : '▾'}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            )}

            {showAiMarkdown && highlights.length > 0 ? (
              <View style={styles.highlights}>
                <ThemedText type="smallBold">Điểm nổi bật</ThemedText>
                {highlights.map((item) => (
                  <ThemedText
                    key={item}
                    type="small"
                    themeColor="textSecondary">
                    • {item}
                  </ThemedText>
                ))}
              </View>
            ) : null}

            <Text style={styles.facilitiesTitle}>Facilities</Text>
            <View style={styles.facilitiesRow}>
              <FacilityCard
                icon="▣"
                label={
                  apartment.area ? `${apartment.area} m²` : 'Diện tích'
                }
              />
              <FacilityCard
                icon="⌂"
                label={getRoomTypeLabel(apartment.roomType)}
              />
              {badge ? (
                <FacilityCard
                  icon="◈"
                  label={badge.label}
                  accent={badge.backgroundColor}
                />
              ) : null}
            </View>

            {showOpsTools ? (
              <View style={styles.opsRow}>
                <QuickDownloadButton apartment={apartment} />
                <Pressable
                  onPress={() => void onCopyApartmentInfo()}
                  accessibilityRole="button"
                  accessibilityLabel="Sao chép thông tin căn hộ"
                  style={({ pressed }) => [
                    styles.copyBtn,
                    pressed && styles.copyBtnPressed,
                  ]}>
                  <Text style={styles.copyBtnIcon}>⧉</Text>
                  <Text style={styles.copyBtnText}>Sao chép thông tin</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </SafeAreaView>
      </ScrollView>

      <View style={styles.bottomDock}>
        <SafeAreaView edges={['bottom']} style={styles.bottomSafe}>
          <View style={styles.bottomBar}>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Giá</Text>
              <Text style={styles.priceValue} numberOfLines={1}>
                {formatPriceAmount(apartment.price)}
              </Text>
              <Text style={styles.priceUnit}>/tháng</Text>
            </View>

            <Pressable
              onPress={() => setBookingOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={bookLabel}
              style={({ pressed }) => [
                styles.bookBtn,
                pressed && styles.bookBtnPressed,
              ]}>
              <Text style={styles.bookBtnText} numberOfLines={1}>
                {bookLabel}
              </Text>
              <Text style={styles.bookBtnArrow}>→</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      <BookingModal
        visible={bookingOpen}
        apartment={apartment}
        onClose={() => setBookingOpen(false)}
      />
    </ThemedView>
  );
}

function FacilityCard({
  icon,
  label,
  accent,
}: {
  icon: string;
  label: string;
  accent?: string;
}) {
  return (
    <View style={styles.facilityCard}>
      <Text style={[styles.facilityIcon, accent ? { color: accent } : null]}>
        {icon}
      </Text>
      <Text style={styles.facilityLabel} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: UI.bottomBarClearance,
  },
  topSafe: {
    paddingBottom: Spacing.two,
  },
  heroWrap: {
    marginHorizontal: Spacing.three,
    marginTop: Spacing.two,
    position: 'relative',
  },
  hero: {
    width: '100%',
    borderRadius: UI.heroRadius,
    overflow: 'hidden',
  },
  backBtn: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  shareBtn: {
    position: 'absolute',
    right: 18,
    bottom: -18,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.14,
        shadowRadius: 10,
      },
      android: { elevation: 5 },
      default: {},
    }),
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  title: {
    flex: 1,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '700',
    color: UI.ink,
    letterSpacing: -0.3,
  },
  districtRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  star: {
    color: UI.star,
    fontSize: 14,
    lineHeight: 18,
  },
  districtText: {
    flex: 1,
    color: UI.muted,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  fullAddress: {
    color: UI.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  commission: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  landlordPhone: {
    color: UI.ink,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  descBlock: {
    gap: Spacing.one,
  },
  sectionLabel: {
    marginTop: Spacing.two,
    fontSize: 12,
    opacity: 0.65,
  },
  description: {
    color: UI.ink,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  readMore: {
    color: UI.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  readMoreChevron: {
    color: UI.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  highlights: {
    gap: Spacing.one,
  },
  facilitiesTitle: {
    marginTop: Spacing.three,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    color: UI.ink,
  },
  facilitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: Spacing.one,
  },
  facilityCard: {
    width: 78,
    minHeight: 78,
    borderRadius: 16,
    backgroundColor: UI.facilityBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 10,
    gap: 6,
  },
  facilityIcon: {
    fontSize: 22,
    color: UI.facilityIcon,
    lineHeight: 26,
  },
  facilityLabel: {
    fontSize: 11,
    lineHeight: 14,
    color: UI.muted,
    textAlign: 'center',
    fontWeight: '500',
  },
  opsRow: {
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
    flexDirection: 'column',
    gap: Spacing.two,
    alignItems: 'stretch',
  },
  copyBtn: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: UI.primary,
    backgroundColor: '#E8F1FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: Spacing.three,
  },
  copyBtnPressed: {
    opacity: 0.85,
  },
  copyBtnIcon: {
    fontSize: 16,
    color: UI.primary,
    fontWeight: '700',
  },
  copyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: UI.primary,
  },
  bottomDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  bottomSafe: {
    backgroundColor: '#FFFFFF',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 16,
  },
  priceBlock: {
    flexShrink: 1,
    maxWidth: '38%',
  },
  priceLabel: {
    fontSize: 13,
    lineHeight: 16,
    color: UI.ink,
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    color: UI.price,
    letterSpacing: -0.4,
  },
  priceUnit: {
    fontSize: 12,
    lineHeight: 16,
    color: UI.muted,
    fontWeight: '500',
  },
  bookBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: UI.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: UI.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 14,
      },
      android: { elevation: 4 },
      default: {},
    }),
  },
  bookBtnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bookBtnArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginTop: -1,
  },
});
