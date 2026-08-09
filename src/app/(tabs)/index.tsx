import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { userData, roleLabel, hasPermission } = useAuth();
  const canSeeCommission = hasPermission('view_commission');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ThemedText type="subtitle">Xin chào</ThemedText>
        <ThemedText type="default">
          {userData?.displayName || userData?.email || 'Khách'}
        </ThemedText>
        {roleLabel ? (
          <ThemedText type="small" themeColor="textSecondary">
            Vai trò: {roleLabel}
          </ThemedText>
        ) : null}
        {canSeeCommission ? (
          <ThemedText type="small" themeColor="textSecondary">
            Bạn có quyền xem hoa hồng (CTV/Admin).
          </ThemedText>
        ) : null}

        <View style={styles.links}>
          <Link href="/apartment/demo">
            <ThemedText type="linkPrimary">Mở chi tiết căn hộ (demo)</ThemedText>
          </Link>
          <Link href="/booking/new">
            <ThemedText type="linkPrimary">Đặt lịch xem phòng</ThemedText>
          </Link>
        </View>
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
  links: {
    marginTop: Spacing.four,
    gap: Spacing.three,
  },
});
