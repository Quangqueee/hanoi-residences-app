import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

export default function NewBookingScreen() {
  const { apartmentId } = useLocalSearchParams<{ apartmentId?: string }>();
  const { isCollaborator, isAdmin, roleLabel } = useAuth();

  let formHint = 'Form đặt lịch xem phòng cá nhân (User).';
  if (isCollaborator) {
    formHint = 'Form đặt lịch dẫn khách — cần nhập thông tin khách thực tế (CTV).';
  } else if (isAdmin) {
    formHint =
      'Form đặt lịch cá nhân + tuỳ chọn gán/điều phối cho CTV (Admin).';
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ThemedText type="subtitle">Đặt lịch</ThemedText>
        {apartmentId ? (
          <ThemedText type="small" themeColor="textSecondary">
            Căn hộ: {apartmentId}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary">
          Vai trò hiện tại: {roleLabel ?? '—'}
        </ThemedText>
        <ThemedText type="default" style={styles.section}>
          {formHint}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Form CRM đầy đủ sẽ được nối với schema booking từ Web ở bước tiếp
          theo.
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
  section: { marginTop: Spacing.three },
});
