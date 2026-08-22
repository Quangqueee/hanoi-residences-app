import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
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
import { HANOI_DISTRICTS } from '@/lib/constants';
import { checkPhoneNumber } from '@/lib/password-utils';
import { submitLandlordRequest } from '@/lib/partner-service';

export default function PartnerRegisterScreen() {
  const router = useRouter();
  const { user, userData, loading, isLandlord, isAdmin } = useAuth();

  const [displayName, setDisplayName] = useState(
    () => user?.displayName?.trim() || '',
  );
  const [phoneNumber, setPhoneNumber] = useState(
    () => userData?.phoneNumber?.trim() || '',
  );
  const [districts, setDistricts] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibleDistricts = useMemo(
    () => (showAllDistricts ? HANOI_DISTRICTS : HANOI_DISTRICTS.slice(0, 6)),
    [showAllDistricts],
  );

  if (!loading && !user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isLandlord || isAdmin) {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-[22px] font-semibold text-hoteliq-ink">
            Bạn đã là đối tác!
          </Text>
          <Text className="mb-6 text-center text-[14px] leading-5 text-hoteliq-gray">
            Tài khoản đã có quyền đăng tin căn hộ.
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

  if (userData?.landlordApprovalStatus === 'pending') {
    return (
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-[22px] font-semibold text-hoteliq-ink">
            Yêu cầu đang được xử lý
          </Text>
          <Text className="mb-6 text-center text-[14px] leading-5 text-hoteliq-gray">
            Ban quản trị sẽ liên hệ và xét duyệt trong thời gian sớm nhất.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="min-h-12 items-center justify-center rounded-full border border-hoteliq-line px-8">
            <Text className="text-[15px] font-semibold text-hoteliq-ink">
              Về trang trước
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const toggleDistrict = (d: string) => {
    setDistricts((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  };

  const onSubmit = async () => {
    setError(null);
    if (!user || submitting) return;

    if (!displayName.trim()) {
      setError('Vui lòng nhập tên đơn vị vận hành.');
      return;
    }
    if (!phoneNumber.trim()) {
      setError('Vui lòng nhập số điện thoại.');
      return;
    }
    const phoneCheck = checkPhoneNumber(phoneNumber);
    if (!phoneCheck.isValid) {
      setError(phoneCheck.errorMessage || 'Số điện thoại không hợp lệ.');
      return;
    }
    if (districts.length === 0) {
      setError('Vui lòng chọn ít nhất một khu vực có phòng.');
      return;
    }
    if (!message.trim()) {
      setError('Vui lòng nhập lời nhắn.');
      return;
    }

    setSubmitting(true);
    try {
      await submitLandlordRequest(user.uid, {
        displayName,
        phoneNumber,
        district: districts.join(', '),
        message,
      });
      Alert.alert(
        'Thành công',
        'Đã gửi yêu cầu đăng ký. Vui lòng chờ admin xét duyệt.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (err) {
      console.error(err);
      setError('Không thể gửi yêu cầu. Vui lòng thử lại.');
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
            Đăng ký chủ nhà
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
            Điền thông tin để tham gia mạng lưới cho thuê của Hanoi Residences.
          </Text>

          {userData?.landlordApprovalStatus === 'rejected' ? (
            <View className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3">
              <Text className="text-[14px] leading-5 text-red-700">
                <Text className="font-semibold">Yêu cầu trước bị từ chối: </Text>
                {userData.landlordRejectionReason || 'Không đạt yêu cầu.'}
                {'\n'}Bạn có thể gửi lại yêu cầu mới bên dưới.
              </Text>
            </View>
          ) : null}

          <Field
            label="Tên đơn vị vận hành *"
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="VD: Hanoi Housing"
          />
          <Field
            label="Số điện thoại liên hệ *"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            placeholder="VD: 0912345678"
          />

          <View className="gap-2">
            <Text className="text-[12px] font-semibold text-hoteliq-gray">
              Khu vực có phòng * ({districts.length} đã chọn)
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {visibleDistricts.map((d) => {
                const active = districts.includes(d);
                return (
                  <Pressable
                    key={d}
                    onPress={() => toggleDistrict(d)}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {d}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {HANOI_DISTRICTS.length > 6 ? (
              <Pressable onPress={() => setShowAllDistricts((v) => !v)}>
                <Text className="text-[13px] font-semibold text-hoteliq-ink underline">
                  {showAllDistricts ? 'Thu gọn' : 'Xem thêm quận'}
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Field
            label="Lời nhắn *"
            value={message}
            onChangeText={setMessage}
            multiline
            placeholder="Số lượng phòng, khu vực chính, nhu cầu hỗ trợ…"
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
                Gửi yêu cầu đăng ký
              </Text>
            )}
          </Pressable>
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
  keyboardType?: 'default' | 'phone-pad';
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
