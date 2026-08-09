import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function BookingsScreen() {
  const { isCollaborator, isAdmin } = useAuth();

  let hint = 'Đặt lịch xem phòng cá nhân.';
  if (isCollaborator) {
    hint = 'Đặt lịch dẫn khách — nhập thông tin khách thực tế.';
  } else if (isAdmin) {
    hint = 'Đặt lịch cá nhân + điều phối/gán lịch cho CTV.';
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ThemedText type="subtitle">Lịch hẹn</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
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
});
