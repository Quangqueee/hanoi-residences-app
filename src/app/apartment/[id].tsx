import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ImageCarousel } from '@/components/image-carousel';
import { QuickDownloadButton } from '@/components/quick-download-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  formatCommission,
  formatPrice,
  getApartmentDisplayDescription,
  getApartmentDisplayTitle,
  getRoomTypeLabel,
  usesAiSeoContent,
} from '@/lib/apartment-display';
import { getApartmentById } from '@/lib/apartments-service';
import { shareApartment } from '@/lib/share-apartment';
import type { Apartment } from '@/lib/types';

export default function ApartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  const description = getApartmentDisplayDescription(apartment, role);
  const showCommission = hasPermission('view_commission');
  const showFullAddress = hasPermission('view_full_address');
  const showOpsTools = isAdmin || isCollaborator;
  const commissionLabel = formatCommission(apartment.commission);
  const highlights = apartment.aiContent?.highlights ?? [];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SafeAreaView edges={['bottom']}>
          <ImageCarousel
            urls={apartment.imageUrls ?? []}
            height={330}
            showDots
            showCounter
            recyclingKey={apartment.id}
            style={styles.hero}
          />

          <View style={styles.body}>
            <ThemedText type="subtitle" style={styles.title}>
              {title}
            </ThemedText>

            <ThemedText type="default" style={styles.price}>
              {formatPrice(apartment.price)}
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary">
              {apartment.district} · {getRoomTypeLabel(apartment.roomType)}
              {apartment.area ? ` · ${apartment.area}m²` : ''}
              {apartment.sourceCode ? ` · ID ${apartment.sourceCode}` : ''}
            </ThemedText>

            {showFullAddress && apartment.address ? (
              <ThemedText type="small" themeColor="textSecondary">
                Địa chỉ: {apartment.address}
              </ThemedText>
            ) : null}

            {showCommission ? (
              <ThemedText type="smallBold" style={styles.commission}>
                Hoa hồng / chiết khấu: {commissionLabel ?? '—'}
              </ThemedText>
            ) : null}

            <View style={styles.actionsRow}>
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
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    borderColor: colors.backgroundSelected,
                    backgroundColor: colors.backgroundElement,
                    opacity: pressed || sharing ? 0.7 : 1,
                  },
                ]}>
                {sharing ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <ThemedText type="smallBold">Chia sẻ</ThemedText>
                )}
              </Pressable>

              {showOpsTools ? (
                <QuickDownloadButton apartment={apartment} />
              ) : null}
            </View>

            <ThemedText type="smallBold" style={styles.sectionLabel}>
              {usesAiSeoContent(role) ? 'Mô tả (AI SEO)' : 'Mô tả gốc'}
            </ThemedText>
            <ThemedText type="default" style={styles.description}>
              {description}
            </ThemedText>

            {usesAiSeoContent(role) && highlights.length > 0 ? (
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

            <Link
              href={{
                pathname: '/booking/new',
                params: { apartmentId: apartment.id },
              }}
              asChild>
              <Pressable
                style={({ pressed }) => [
                  styles.cta,
                  {
                    backgroundColor: colors.text,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <ThemedText
                  type="smallBold"
                  style={{ color: colors.background }}>
                  {isAdmin
                    ? 'Thêm lịch cho căn này'
                    : isCollaborator
                      ? 'Đặt lịch dẫn khách'
                      : 'Đặt lịch xem phòng'}
                </ThemedText>
              </Pressable>
            </Link>
          </View>
        </SafeAreaView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  scroll: {
    paddingBottom: Spacing.six,
  },
  hero: {
    width: '100%',
  },
  body: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  commission: {
    color: '#2e7d32',
    marginTop: Spacing.one,
  },
  actionsRow: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    alignItems: 'center',
  },
  secondaryBtn: {
    minHeight: 40,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    marginTop: Spacing.three,
  },
  description: {
    lineHeight: 24,
  },
  highlights: {
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  cta: {
    marginTop: Spacing.four,
    minHeight: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
