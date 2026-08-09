import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function ProfileScreen() {
  const {
    user,
    userData,
    roleLabel,
    logout,
    isAdmin,
    isCollaborator,
    isLandlord,
  } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onLogout = async () => {
    setError(null);
    setBusy(true);
    try {
      await logout();
    } catch {
      setError('Không thể đăng xuất. Thử lại sau.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.safe}>
        <ThemedText type="subtitle">Tài khoản</ThemedText>

        <View style={styles.meta}>
          <ThemedText type="default">
            {userData?.displayName || 'Chưa cập nhật tên'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {user?.email}
          </ThemedText>
          {roleLabel ? (
            <ThemedText type="small" themeColor="textSecondary">
              Vai trò: {roleLabel}
            </ThemedText>
          ) : null}
          {isAdmin || isCollaborator ? (
            <ThemedText type="small" themeColor="textSecondary">
              Quyền vận hành: xem hoa hồng / điều phối
            </ThemedText>
          ) : null}
          {isLandlord ? (
            <ThemedText type="small" themeColor="textSecondary">
              Chủ nhà — trạng thái duyệt:{' '}
              {userData?.landlordApprovalStatus ?? '—'}
            </ThemedText>
          ) : null}
        </View>

        {error ? (
          <ThemedText type="small" style={styles.error}>
            {error}
          </ThemedText>
        ) : null}

        <Pressable
          onPress={onLogout}
          disabled={busy}
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: colors.text,
              opacity: pressed || busy ? 0.7 : 1,
            },
          ]}>
          {busy ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <ThemedText type="smallBold" style={{ color: colors.background }}>
              Đăng xuất
            </ThemedText>
          )}
        </Pressable>

        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          Xóa tài khoản & Chính sách bảo mật sẽ được thêm trong phần Cài đặt
          (compliance App Store / Play Store).
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
    paddingBottom: 100,
    gap: Spacing.three,
  },
  meta: { gap: Spacing.one },
  button: {
    minHeight: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: { color: '#C62828' },
  note: { marginTop: 'auto' },
});
