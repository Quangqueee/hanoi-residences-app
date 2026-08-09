import { useLocalSearchParams, Link } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function ApartmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { hasPermission, isAdmin, isCollaborator } = useAuth();

  const showAiSeo = !isAdmin && !isCollaborator;
  const showCommission = hasPermission('view_commission');
  const showFullAddress = hasPermission('view_full_address');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ThemedText type="subtitle">Căn hộ</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          ID: {id}
        </ThemedText>

        <ThemedText type="default" style={styles.section}>
          {showAiSeo
            ? 'User/Landlord: hiển thị tiêu đề & mô tả AI SEO (aiContent).'
            : 'Admin/CTV: hiển thị mô tả gốc + chiết khấu/hoa hồng.'}
        </ThemedText>

        {showCommission ? (
          <ThemedText type="small" themeColor="textSecondary">
            Hoa hồng: sẽ lấy từ field commission (đang placeholder).
          </ThemedText>
        ) : null}
        {showFullAddress ? (
          <ThemedText type="small" themeColor="textSecondary">
            Địa chỉ đầy đủ: quyền Admin.
          </ThemedText>
        ) : null}
        {isAdmin || isCollaborator ? (
          <ThemedText type="small" themeColor="textSecondary">
            Nút “Tải hình ảnh nhanh” sẽ gắn ở đây.
          </ThemedText>
        ) : null}

        <Link href={{ pathname: '/booking/new', params: { apartmentId: id } }}>
          <ThemedText type="linkPrimary">Đặt lịch căn này</ThemedText>
        </Link>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  section: { marginTop: Spacing.three },
});
