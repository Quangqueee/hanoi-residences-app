import { Link, Redirect, type Href } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/user-disabled':
      return 'Tài khoản đã bị vô hiệu hóa.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email hoặc mật khẩu không đúng.';
    case 'auth/too-many-requests':
      return 'Thử lại quá nhiều lần. Vui lòng đợi ít phút.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ Google đã đóng trước khi hoàn tất.';
    case 'auth/google-native-unavailable':
      return 'Google Sign-In trên thiết bị chưa cấu hình. Dùng email hoặc bản Web.';
    case 'auth/popup-blocked':
      return 'Trình duyệt chặn popup Google. Cho phép popup rồi thử lại.';
    default:
      return 'Đăng nhập thất bại. Vui lòng thử lại.';
  }
}

export default function LoginScreen() {
  const { user, loading, login, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<
    'email' | 'password' | null
  >(null);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Vui lòng nhập email và mật khẩu.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogle = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const busy = submitting || googleSubmitting;

  const inputClass = (field: 'email' | 'password') =>
    `h-[52px] rounded-[12px] border bg-white px-4 text-[16px] leading-[22px] text-hoteliq-ink ${
      focusedField === field ? 'border-hoteliq-ink' : 'border-hoteliq-line'
    }`;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="gap-2 pt-14">
              <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
                Hanoi Residences
              </Text>
              <Text className="text-[14px] leading-5 text-hoteliq-gray">
                Đăng nhập để tiếp tục
              </Text>
            </View>

            {/* Spacer keeps the form + CTA in the lower half for one-hand reach */}
            <View className="min-h-[32px] flex-1" />

            {/* Form */}
            <View className="gap-4">
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={Hoteliq.muted}
                className={inputClass('email')}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              <TextInput
                secureTextEntry
                placeholder="Mật khẩu"
                placeholderTextColor={Hoteliq.muted}
                className={inputClass('password')}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />

              <View className="items-end">
                <Link href={'/(auth)/forgot-password' as Href} asChild>
                  <Pressable
                    hitSlop={8}
                    className="min-h-[36px] justify-center"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                    <Text className="text-[13px] font-medium leading-[18px] text-hoteliq-gray underline">
                      Quên mật khẩu?
                    </Text>
                  </Pressable>
                </Link>
              </View>

              {error ? (
                <Text className="text-[13px] leading-[18px] text-[#C13515]">
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={() => void onSubmit()}
                disabled={busy}
                accessibilityRole="button"
                className="mt-1 h-12 items-center justify-center rounded-full bg-hoteliq-primary"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? Hoteliq.primaryDark
                    : Hoteliq.primary,
                  opacity: busy ? 0.7 : 1,
                })}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[16px] font-semibold text-white">
                    Đăng nhập
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => void onGoogle()}
                disabled={busy}
                accessibilityRole="button"
                className="h-12 items-center justify-center rounded-full border border-hoteliq-line bg-white"
                style={({ pressed }) => ({
                  opacity: busy ? 0.7 : pressed ? 0.85 : 1,
                })}>
                {googleSubmitting ? (
                  <ActivityIndicator color={Hoteliq.ink} />
                ) : (
                  <Text className="text-[16px] font-semibold text-hoteliq-ink">
                    Tiếp tục với Google
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Footer */}
            <View className="mt-6 min-h-[44px] flex-row items-center justify-center">
              <Text
                className="text-[14px] leading-5 text-hoteliq-gray"
                numberOfLines={1}>
                Chưa có tài khoản?{' '}
              </Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable
                  hitSlop={8}
                  className="min-h-[44px] justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Text className="text-[14px] font-semibold leading-5 text-hoteliq-ink underline">
                    Đăng ký
                  </Text>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
