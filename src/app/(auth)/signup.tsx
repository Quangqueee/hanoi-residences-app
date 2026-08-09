import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu cần ít nhất 6 ký tự.';
    default:
      return 'Đăng ký thất bại. Vui lòng thử lại.';
  }
}

export default function SignupScreen() {
  const { user, loading, signup } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Vui lòng điền họ tên, email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      await signup(email, password, fullName, phoneNumber);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="title">Tạo tài khoản</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Đồng bộ với hệ thống Hanoi Residences
            </ThemedText>

            <TextInput
              placeholder="Họ và tên"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              keyboardType="phone-pad"
              placeholder="Số điện thoại (tuỳ chọn)"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
            <TextInput
              secureTextEntry
              placeholder="Mật khẩu"
              placeholderTextColor={colors.textSecondary}
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.backgroundElement,
                },
              ]}
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <ThemedText type="small" style={styles.error}>
                {error}
              </ThemedText>
            ) : null}

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.text,
                  opacity: pressed || submitting ? 0.7 : 1,
                },
              ]}>
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <ThemedText
                  type="smallBold"
                  style={{ color: colors.background }}>
                  Đăng ký
                </ThemedText>
              )}
            </Pressable>

            <Link href="/(auth)/login" style={styles.footerLink}>
              <ThemedText type="link">Đã có tài khoản? Đăng nhập</ThemedText>
            </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.two,
  },
  error: { color: '#C62828' },
  footerLink: {
    alignSelf: 'center',
    marginTop: Spacing.two,
  },
});
