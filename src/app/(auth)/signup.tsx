import { Link, Redirect } from 'expo-router';
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
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng.';
    case 'auth/invalid-email':
      return 'Email không hợp lệ.';
    case 'auth/weak-password':
      return 'Mật khẩu cần ít nhất 6 ký tự.';
    case 'auth/popup-closed-by-user':
      return 'Cửa sổ Google đã đóng trước khi hoàn tất.';
    case 'auth/google-native-unavailable':
      return 'Google Sign-In trên thiết bị chưa cấu hình. Dùng email hoặc bản Web.';
    case 'auth/popup-blocked':
      return 'Trình duyệt chặn popup Google. Cho phép popup rồi thử lại.';
    default:
      return 'Đăng ký thất bại. Vui lòng thử lại.';
  }
}

type FieldKey = 'fullName' | 'email' | 'phoneNumber' | 'password';

export default function SignupScreen() {
  const { user, loading, signup, loginWithGoogle } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<FieldKey | null>(null);

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
  const showGoogle = Platform.OS === 'web';

  const inputClass = (field: FieldKey) =>
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
                Tạo tài khoản
              </Text>
              <Text className="text-[14px] leading-5 text-hoteliq-gray">
                Đồng bộ với hệ thống Hanoi Residences
              </Text>
            </View>

            {/* Spacer keeps the form + CTA in the lower half for one-hand reach */}
            <View className="min-h-[24px] flex-1" />

            {/* Form */}
            <View className="gap-4">
              <TextInput
                placeholder="Họ và tên"
                placeholderTextColor={Hoteliq.muted}
                className={inputClass('fullName')}
                value={fullName}
                onChangeText={setFullName}
                onFocus={() => setFocusedField('fullName')}
                onBlur={() => setFocusedField(null)}
              />
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
                keyboardType="phone-pad"
                placeholder="Số điện thoại (tuỳ chọn)"
                placeholderTextColor={Hoteliq.muted}
                className={inputClass('phoneNumber')}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                onFocus={() => setFocusedField('phoneNumber')}
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
                    Đăng ký
                  </Text>
                )}
              </Pressable>

              {showGoogle ? (
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
              ) : null}
            </View>

            {/* Footer */}
            <View className="mt-6 min-h-[44px] flex-row items-center justify-center">
              <Text
                className="text-[14px] leading-5 text-hoteliq-gray"
                numberOfLines={1}>
                Đã có tài khoản?{' '}
              </Text>
              <Link href="/(auth)/login" asChild>
                <Pressable
                  hitSlop={8}
                  className="min-h-[44px] justify-center"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Text className="text-[14px] font-semibold leading-5 text-hoteliq-ink underline">
                    Đăng nhập
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
