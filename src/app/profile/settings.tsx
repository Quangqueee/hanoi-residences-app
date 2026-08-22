import { Redirect, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { changePassword } from '@/lib/auth-service';
import {
  checkPasswordMatch,
  checkPasswordStrength,
  getPasswordStrengthMessage,
} from '@/lib/password-utils';
import { updateUserProfile } from '@/lib/profile-service';

const GENDER_OPTIONS = [
  { value: '', label: 'Không chọn' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
] as const;

type InfoField = 'dob' | 'interests';
type PassField = 'currentPassword' | 'newPassword' | 'confirmPassword';

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const isSocialLogin = useMemo(
    () =>
      Boolean(
        user?.providerData?.some(
          (p) =>
            p.providerId === 'google.com' || p.providerId === 'facebook.com',
        ),
      ),
    [user?.providerData],
  );

  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [interests, setInterests] = useState('');
  const [infoSubmitting, setInfoSubmitting] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoFocused, setInfoFocused] = useState<InfoField | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSubmitting, setPassSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passError, setPassError] = useState<string | null>(null);
  const [passFocused, setPassFocused] = useState<PassField | null>(null);

  useEffect(() => {
    setDob(userData?.dob?.trim() || '');
    setGender(userData?.gender?.trim() || '');
    setInterests(userData?.interests?.trim() || '');
  }, [userData]);

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const inputClass = (active: boolean) =>
    `min-h-[52px] rounded-[12px] border bg-white px-4 py-3 text-[16px] leading-[22px] text-hoteliq-ink ${
      active ? 'border-hoteliq-ink' : 'border-hoteliq-line'
    }`;

  const onSaveInfo = async () => {
    if (!user) return;
    setInfoError(null);
    setInfoSubmitting(true);
    try {
      await updateUserProfile(user.uid, {
        dob,
        gender,
        interests,
      });
      Alert.alert('Thành công', 'Đã cập nhật cài đặt cá nhân.');
    } catch (err) {
      console.error(err);
      setInfoError('Không thể lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setInfoSubmitting(false);
    }
  };

  const onChangePassword = async () => {
    setPassError(null);
    setPasswordErrors([]);

    if (!currentPassword) {
      setPassError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    const match = checkPasswordMatch(newPassword, confirmPassword);
    const nextErrors = [...strength.errors];
    if (!match.isValid && match.errorMessage) {
      nextErrors.push(match.errorMessage);
    }
    setPasswordErrors(nextErrors);

    if (!strength.isValid || !match.isValid) {
      setPassError('Mật khẩu chưa đủ mạnh. Vui lòng sửa các lỗi bên dưới.');
      return;
    }

    setPassSubmitting(true);
    try {
      await changePassword(newPassword, currentPassword);
      Alert.alert('Thành công', 'Mật khẩu đã được thay đổi.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors([]);
    } catch (error: unknown) {
      const code =
        typeof error === 'object' && error && 'code' in error
          ? String((error as { code?: string }).code)
          : '';
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password'
      ) {
        setPassError('Mật khẩu hiện tại không đúng.');
      } else if (code === 'auth/requires-recent-login') {
        setPassError('Vui lòng đăng xuất và đăng nhập lại rồi đổi mật khẩu.');
      } else if (code === 'auth/too-many-requests') {
        setPassError('Thử sai quá nhiều lần. Vui lòng đợi rồi thử lại.');
      } else {
        setPassError('Không thể đổi mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setPassSubmitting(false);
    }
  };

  const strengthPreview =
    newPassword.length > 0
      ? getPasswordStrengthMessage(checkPasswordStrength(newPassword).strengthLevel)
      : null;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="flex-row items-center px-4 pb-2 pt-1">
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              accessibilityRole="button"
              className="min-h-[44px] justify-center px-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text className="text-[16px] font-semibold text-hoteliq-ink">
                ← Quay lại
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text className="pt-2 text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
              Cài đặt
            </Text>
            <Text className="mt-1 text-[14px] leading-5 text-hoteliq-gray">
              Thông tin bổ sung và bảo mật tài khoản (đồng bộ website).
            </Text>

            {/* Personal info */}
            <Text className="mb-3 mt-8 text-[18px] font-semibold text-hoteliq-ink">
              Thông tin cá nhân
            </Text>

            <View className="gap-4">
              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Ngày sinh
                </Text>
                <TextInput
                  placeholder="YYYY-MM-DD hoặc DD/MM/YYYY"
                  placeholderTextColor={Hoteliq.muted}
                  className={inputClass(infoFocused === 'dob')}
                  value={dob}
                  onChangeText={setDob}
                  onFocus={() => setInfoFocused('dob')}
                  onBlur={() => setInfoFocused(null)}
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Giới tính
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GENDER_OPTIONS.map((opt) => {
                    const selected = gender === opt.value;
                    return (
                      <Pressable
                        key={opt.value || 'none'}
                        onPress={() => setGender(opt.value)}
                        className={`rounded-full border px-4 py-2.5 ${
                          selected
                            ? 'border-hoteliq-ink bg-hoteliq-ink'
                            : 'border-hoteliq-line bg-white'
                        }`}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.85 : 1,
                        })}>
                        <Text
                          className={`text-[14px] font-semibold ${
                            selected ? 'text-white' : 'text-hoteliq-ink'
                          }`}>
                          {opt.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Sở thích / nhu cầu thuê
                </Text>
                <TextInput
                  multiline
                  textAlignVertical="top"
                  placeholder="VD: gần hồ, pet friendly, studio..."
                  placeholderTextColor={Hoteliq.muted}
                  className={`${inputClass(infoFocused === 'interests')} min-h-[96px]`}
                  value={interests}
                  onChangeText={setInterests}
                  onFocus={() => setInfoFocused('interests')}
                  onBlur={() => setInfoFocused(null)}
                />
              </View>

              {infoError ? (
                <Text className="text-[13px] leading-[18px] text-[#C13515]">
                  {infoError}
                </Text>
              ) : null}

              <Pressable
                onPress={() => void onSaveInfo()}
                disabled={infoSubmitting}
                accessibilityRole="button"
                className="h-12 items-center justify-center rounded-full bg-hoteliq-primary"
                style={({ pressed }) => ({
                  backgroundColor: pressed
                    ? Hoteliq.primaryDark
                    : Hoteliq.primary,
                  opacity: infoSubmitting ? 0.7 : 1,
                })}>
                {infoSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[16px] font-semibold text-white">
                    Lưu cài đặt
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Password */}
            <Text className="mb-3 mt-10 text-[18px] font-semibold text-hoteliq-ink">
              Đổi mật khẩu
            </Text>

            {isSocialLogin ? (
              <View className="rounded-[12px] border border-hoteliq-line bg-hoteliq-chip px-4 py-4">
                <Text className="text-[14px] leading-5 text-hoteliq-gray">
                  Tài khoản đăng nhập bằng Google/Facebook không đổi mật khẩu
                  email tại đây (giống website).
                </Text>
              </View>
            ) : (
              <View className="gap-4">
                <View className="gap-1.5">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                    Mật khẩu hiện tại
                  </Text>
                  <TextInput
                    secureTextEntry
                    placeholder="Mật khẩu hiện tại"
                    placeholderTextColor={Hoteliq.muted}
                    className={inputClass(passFocused === 'currentPassword')}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    onFocus={() => setPassFocused('currentPassword')}
                    onBlur={() => setPassFocused(null)}
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                    Mật khẩu mới
                  </Text>
                  <TextInput
                    secureTextEntry
                    placeholder="Mật khẩu mới"
                    placeholderTextColor={Hoteliq.muted}
                    className={inputClass(passFocused === 'newPassword')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    onFocus={() => setPassFocused('newPassword')}
                    onBlur={() => setPassFocused(null)}
                  />
                  {strengthPreview ? (
                    <Text className="text-[12px] text-hoteliq-gray">
                      {strengthPreview}
                    </Text>
                  ) : null}
                </View>

                <View className="gap-1.5">
                  <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                    Nhắc lại mật khẩu mới
                  </Text>
                  <TextInput
                    secureTextEntry
                    placeholder="Nhắc lại mật khẩu mới"
                    placeholderTextColor={Hoteliq.muted}
                    className={inputClass(passFocused === 'confirmPassword')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setPassFocused('confirmPassword')}
                    onBlur={() => setPassFocused(null)}
                  />
                </View>

                {passError ? (
                  <Text className="text-[13px] leading-[18px] text-[#C13515]">
                    {passError}
                  </Text>
                ) : null}

                {passwordErrors.length > 0 ? (
                  <View className="gap-1">
                    {passwordErrors.map((msg) => (
                      <Text
                        key={msg}
                        className="text-[13px] leading-[18px] text-[#C13515]">
                        • {msg}
                      </Text>
                    ))}
                  </View>
                ) : null}

                <Pressable
                  onPress={() => void onChangePassword()}
                  disabled={passSubmitting}
                  accessibilityRole="button"
                  className="h-12 items-center justify-center rounded-full border border-hoteliq-ink bg-white"
                  style={({ pressed }) => ({
                    opacity: passSubmitting || pressed ? 0.75 : 1,
                  })}>
                  {passSubmitting ? (
                    <ActivityIndicator color={Hoteliq.ink} />
                  ) : (
                    <Text className="text-[16px] font-semibold text-hoteliq-ink">
                      Đổi mật khẩu
                    </Text>
                  )}
                </Pressable>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
