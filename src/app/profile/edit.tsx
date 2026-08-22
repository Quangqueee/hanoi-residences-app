import { Redirect, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { checkPhoneNumber } from '@/lib/password-utils';
import { updateUserProfile } from '@/lib/profile-service';

type FieldKey =
  | 'displayName'
  | 'phoneNumber'
  | 'address'
  | 'preferredDistrict';

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [preferredDistrict, setPreferredDistrict] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<FieldKey | null>(null);

  useEffect(() => {
    setDisplayName(userData?.displayName?.trim() || user?.displayName || '');
    setPhoneNumber(userData?.phoneNumber?.trim() || '');
    setAddress(userData?.address?.trim() || '');
    setPreferredDistrict(userData?.preferredDistrict?.trim() || '');
  }, [userData, user?.displayName]);

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const onSave = async () => {
    setError(null);
    if (!user) return;

    if (!displayName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }

    if (phoneNumber.trim()) {
      const phoneCheck = checkPhoneNumber(phoneNumber);
      if (!phoneCheck.isValid) {
        setError(phoneCheck.errorMessage || 'Số điện thoại không hợp lệ.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await updateUserProfile(user.uid, {
        displayName,
        phoneNumber,
        address,
        preferredDistrict,
      });
      Alert.alert('Thành công', 'Đã cập nhật hồ sơ.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error(err);
      setError('Không thể lưu hồ sơ. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field: FieldKey) =>
    `h-[52px] rounded-[12px] border bg-white px-4 text-[16px] leading-[22px] text-hoteliq-ink ${
      focused === field ? 'border-hoteliq-ink' : 'border-hoteliq-line'
    }`;

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View className="flex-row items-center justify-between px-4 pb-2 pt-1">
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
              paddingBottom: 32,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Text className="pt-2 text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
              Sửa hồ sơ
            </Text>
            <Text className="mt-1 text-[14px] leading-5 text-hoteliq-gray">
              Đồng bộ với website — đội ngũ Sale dùng thông tin này để gợi ý căn
              phù hợp.
            </Text>

            <View className="mt-8 gap-4">
              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Họ và tên
                </Text>
                <TextInput
                  placeholder="Họ và tên"
                  placeholderTextColor={Hoteliq.muted}
                  className={inputClass('displayName')}
                  value={displayName}
                  onChangeText={setDisplayName}
                  onFocus={() => setFocused('displayName')}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Số điện thoại
                </Text>
                <TextInput
                  keyboardType="phone-pad"
                  placeholder="09xx..."
                  placeholderTextColor={Hoteliq.muted}
                  className={inputClass('phoneNumber')}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  onFocus={() => setFocused('phoneNumber')}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Địa chỉ
                </Text>
                <TextInput
                  placeholder="Địa chỉ liên hệ (tuỳ chọn)"
                  placeholderTextColor={Hoteliq.muted}
                  className={inputClass('address')}
                  value={address}
                  onChangeText={setAddress}
                  onFocus={() => setFocused('address')}
                  onBlur={() => setFocused(null)}
                />
              </View>

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold uppercase tracking-wide text-hoteliq-gray">
                  Khu vực ưu tiên thuê
                </Text>
                <TextInput
                  placeholder="VD: Tây Hồ, Ba Đình..."
                  placeholderTextColor={Hoteliq.muted}
                  className={inputClass('preferredDistrict')}
                  value={preferredDistrict}
                  onChangeText={setPreferredDistrict}
                  onFocus={() => setFocused('preferredDistrict')}
                  onBlur={() => setFocused(null)}
                />
              </View>

              {error ? (
                <Text className="text-[13px] leading-[18px] text-[#C13515]">
                  {error}
                </Text>
              ) : null}

              <Pressable
                onPress={() => void onSave()}
                disabled={submitting}
                accessibilityRole="button"
                className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-primary"
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
                    Lưu hồ sơ
                  </Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
