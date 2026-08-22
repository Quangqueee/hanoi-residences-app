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

function getResetErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error && 'code' in error
      ? String((error as { code?: string }).code)
      : '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản với email này.';
    case 'auth/too-many-requests':
      return 'Thử lại quá nhiều lần. Vui lòng đợi ít phút.';
    default:
      return 'Không gửi được email đặt lại mật khẩu. Vui lòng thử lại.';
  }
}

export default function ForgotPasswordScreen() {
  const { user, loading, resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  if (!loading && user) {
    return <Redirect href="/(tabs)" />;
  }

  const onSubmit = async () => {
    setError(null);
    setSent(false);
    if (!email.trim()) {
      setError('Vui lòng nhập email.');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(getResetErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

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
            <View className="gap-2 pt-14">
              <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
                Quên mật khẩu
              </Text>
              <Text className="text-[14px] leading-5 text-hoteliq-gray">
                Nhập email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu
                (cùng hệ thống với website).
              </Text>
            </View>

            <View className="min-h-[32px] flex-1" />

            <View className="gap-4">
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="Email"
                placeholderTextColor={Hoteliq.muted}
                className={`h-[52px] rounded-[12px] border bg-white px-4 text-[16px] leading-[22px] text-hoteliq-ink ${
                  focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'
                }`}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />

              {error ? (
                <Text className="text-[13px] leading-[18px] text-[#C13515]">
                  {error}
                </Text>
              ) : null}

              {sent ? (
                <Text className="text-[13px] leading-[18px] text-[#0B6E4F]">
                  Đã gửi email đặt lại mật khẩu. Kiểm tra hộp thư (và spam).
                </Text>
              ) : null}

              <Pressable
                onPress={() => void onSubmit()}
                disabled={submitting}
                accessibilityRole="button"
                className="mt-1 h-12 items-center justify-center rounded-full bg-hoteliq-primary"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? Hoteliq.primaryDark
                    : Hoteliq.primary,
                  opacity: submitting ? 0.7 : 1,
                })}>
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[16px] font-semibold text-white">
                    Gửi link đặt lại
                  </Text>
                )}
              </Pressable>
            </View>

            <View className="mt-6 min-h-[44px] flex-row items-center justify-center">
              <Link href={'/(auth)/login' as Href} asChild>
                <Pressable
                  hitSlop={8}
                  className="min-h-[44px] justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Text className="text-[14px] font-semibold leading-5 text-hoteliq-ink underline">
                    Quay lại đăng nhập
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
