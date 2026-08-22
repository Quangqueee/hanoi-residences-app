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
import { submitCtvRegistration } from '@/lib/partner-service';

const GENDERS = ['Nam', 'Nữ', 'Khác'] as const;

export default function CtvRegisterScreen() {
  const router = useRouter();
  const { user, userData, loading, isCollaborator, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [introduction, setIntroduction] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedLocal, setSubmittedLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(userData?.displayName?.trim() || user?.displayName || '');
    setPhoneNumber(userData?.phoneNumber?.trim() || '');
    setDob(userData?.dob?.trim() || '');
    setGender(userData?.gender?.trim() || '');
  }, [userData, user?.displayName]);

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isCollaborator || isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-[22px] font-semibold text-hoteliq-ink">
            Bạn đã có quyền CTV / Admin
          </Text>
          <Text className="mb-6 text-center text-[14px] leading-5 text-hoteliq-gray">
            Không cần gửi thêm hồ sơ đăng ký cộng tác viên.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="min-h-12 items-center justify-center rounded-full bg-hoteliq-ink px-8">
            <Text className="text-[15px] font-semibold text-white">Quay lại</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isPending =
    userData?.requestStatus === 'pending' || submittedLocal;

  const onSubmit = async () => {
    setError(null);
    if (!user || isPending || submitting) return;

    if (
      !displayName.trim() ||
      !phoneNumber.trim() ||
      !dob.trim() ||
      !gender ||
      !introduction.trim()
    ) {
      setError('Vui lòng điền đầy đủ tất cả các trường bắt buộc.');
      return;
    }

    const phoneCheck = checkPhoneNumber(phoneNumber);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.errorMessage || 'Số điện thoại không hợp lệ.');
      return;
    }

    const ageNum = Number(dob.trim());
    const currentYear = new Date().getFullYear();
    if (
      !/^\d{4}$/.test(dob.trim()) ||
      ageNum < 1940 ||
      ageNum > currentYear - 16
    ) {
      setError('Năm sinh không hợp lệ (VD: 1995).');
      return;
    }

    setSubmitting(true);
    try {
      await submitCtvRegistration({
        uid: user.uid,
        email: user.email,
        displayName,
        phoneNumber,
        dob,
        gender,
        introduction,
      });
      setSubmittedLocal(true);
      Alert.alert(
        'Gửi yêu cầu thành công',
        'Chúng tôi đã nhận hồ sơ. Bạn sẽ được thông báo khi được xét duyệt.\nHỗ trợ: 081.2442.111 (Quang)',
      );
    } catch (err) {
      console.error(err);
      setError('Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
          <Text className="text-[20px] font-semibold text-hoteliq-ink">
            Đăng ký CTV
          </Text>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              Đóng
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled">
          <Text className="text-[14px] leading-5 text-hoteliq-gray">
            Điền thông tin để trở thành cộng tác viên của Hanoi Residences.
          </Text>

          {isPending ? (
            <View className="items-center rounded-[12px] border border-amber-200 bg-amber-50 px-5 py-8">
              <Text className="mb-2 text-center text-[17px] font-semibold text-amber-900">
                Hồ sơ đang được xét duyệt
              </Text>
              <Text className="text-center text-[14px] leading-5 text-amber-800/90">
                Đội ngũ quản lý sẽ liên hệ qua số điện thoại đã đăng ký.
              </Text>
            </View>
          ) : (
            <>
              <Field
                label="Họ và tên *"
                value={displayName}
                onChangeText={setDisplayName}
              />
              <Field
                label="Số điện thoại *"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
              <Field
                label="Năm sinh *"
                value={dob}
                onChangeText={(t) => setDob(t.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                placeholder="VD: 1995"
              />

              <View className="gap-1.5">
                <Text className="text-[12px] font-semibold text-hoteliq-gray">
                  Giới tính *
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GENDERS.map((g) => {
                    const active = gender === g;
                    return (
                      <Pressable
                        key={g}
                        onPress={() => setGender(g)}
                        className={`rounded-full border px-4 py-2.5 ${
                          active
                            ? 'border-hoteliq-ink bg-hoteliq-ink'
                            : 'border-hoteliq-line bg-white'
                        }`}>
                        <Text
                          className={`text-[13px] font-semibold ${
                            active ? 'text-white' : 'text-hoteliq-gray'
                          }`}>
                          {g}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Field
                label="Kinh nghiệm / Giới thiệu *"
                value={introduction}
                onChangeText={setIntroduction}
                multiline
                placeholder="Giới thiệu bản thân, kinh nghiệm làm việc…"
              />

              {error ? (
                <Text className="text-[14px] text-red-600">{error}</Text>
              ) : null}

              <Pressable
                onPress={() => void onSubmit()}
                disabled={submitting}
                className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-ink"
                style={({ pressed }) => ({
                  opacity: submitting ? 0.7 : pressed ? 0.9 : 1,
                })}>
                {submitting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[15px] font-semibold text-white">
                    Xác nhận gửi hồ sơ
                  </Text>
                )}
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold text-hoteliq-gray">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Hoteliq.mutedLight}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-[12px] border bg-white px-4 text-[15px] text-hoteliq-ink ${
          multiline ? 'min-h-[110px] py-3' : 'min-h-[48px] py-3'
        } ${focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}
