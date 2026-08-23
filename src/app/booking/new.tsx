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
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { getApartmentById } from '@/lib/apartments-service';
import {
  createBooking,
  fetchCollaborators,
  type AdminBookingMode,
  type CollaboratorOption,
} from '@/lib/bookings-service';
import type { Apartment } from '@/lib/types';

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  if (!value) return true;
  return /^\d{2}:\d{2}$/.test(value);
}

export default function NewBookingScreen() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId?: string }>();
  const {
    user,
    userData,
    role,
    isAdmin,
    isCollaborator,
    roleLabel,
    loading: authLoading,
  } = useAuth();

  const isGuest = !user;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loadingApt, setLoadingApt] = useState(!!apartmentId);
  const [submitting, setSubmitting] = useState(false);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');

  // User fields
  const [name, setName] = useState(userData?.displayName || '');
  const [phone, setPhone] = useState(userData?.phoneNumber || '');

  // CTV / Admin client fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');

  // Admin assign CTV
  const [adminMode, setAdminMode] = useState<AdminBookingMode>('personal');
  const [ctvList, setCtvList] = useState<CollaboratorOption[]>([]);
  const [ctvSearch, setCtvSearch] = useState('');
  const [selectedCtv, setSelectedCtv] = useState<CollaboratorOption | null>(
    null,
  );
  const [loadingCtv, setLoadingCtv] = useState(false);

  useEffect(() => {
    setName(userData?.displayName || '');
    setPhone(userData?.phoneNumber || '');
  }, [userData?.displayName, userData?.phoneNumber]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!apartmentId) {
        setLoadingApt(false);
        return;
      }
      setLoadingApt(true);
      try {
        const data = await getApartmentById(apartmentId);
        if (active) setApartment(data);
      } finally {
        if (active) setLoadingApt(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [apartmentId]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const load = async () => {
      setLoadingCtv(true);
      try {
        const list = await fetchCollaborators();
        if (active) setCtvList(list);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoadingCtv(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const filteredCtv = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase();
    if (!q) return ctvList;
    return ctvList.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q),
    );
  }, [ctvList, ctvSearch]);

  const screenTitle = isGuest
    ? 'Đặt lịch tư vấn'
    : isAdmin
      ? 'Thêm lịch cho căn này'
      : isCollaborator
        ? 'Đặt lịch dẫn khách'
        : 'Đặt lịch xem phòng';

  const onSubmit = async () => {
    if (!apartmentId) {
      Alert.alert('Thiếu căn hộ', 'Vui lòng mở đặt lịch từ trang chi tiết căn hộ.');
      return;
    }
    if (!isGuest && (!role || role === 'landlord')) {
      Alert.alert(
        'Không hỗ trợ',
        'Tài khoản hiện tại không thể tạo lịch hẹn từ app. Vui lòng dùng tài khoản User/CTV/Admin.',
      );
      return;
    }
    if (!isValidDate(bookingDate)) {
      Alert.alert('Ngày không hợp lệ', 'Nhập ngày theo định dạng YYYY-MM-DD.');
      return;
    }
    if (!isValidTime(bookingTime)) {
      Alert.alert('Giờ không hợp lệ', 'Nhập giờ theo định dạng HH:mm hoặc để trống.');
      return;
    }

    if (isCollaborator || (isAdmin && adminMode === 'assign_ctv')) {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert('Thiếu thông tin khách', 'Vui lòng nhập tên và SĐT khách.');
        return;
      }
    }

    if (isCollaborator && !consultationPrice.trim()) {
      Alert.alert('Thiếu giá tư vấn', 'CTV cần nhập giá tư vấn báo khách.');
      return;
    }

    if (!isCollaborator && !isAdmin) {
      if (!name.trim() || !phone.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại.');
        return;
      }
    }

    if (isAdmin && adminMode === 'assign_ctv' && !selectedCtv) {
      Alert.alert('Chưa chọn CTV', 'Vui lòng chọn một CTV để gán lịch.');
      return;
    }

    if (isAdmin && adminMode === 'personal') {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert(
          'Thiếu thông tin',
          'Nhập tên và SĐT khách cho lịch cá nhân/private.',
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createBooking({
        role: isGuest ? null : role,
        isGuest,
        apartmentId,
        apartmentCode: apartment?.sourceCode,
        apartmentTitle: apartment?.title,
        bookingDate,
        bookingTime: bookingTime || undefined,
        notes,
        budget,
        name,
        phone,
        userId: user?.uid,
        clientName,
        clientPhone,
        consultationPrice,
        ctvId: isAdmin
          ? selectedCtv?.uid
          : isCollaborator
            ? user?.uid
            : undefined,
        ctvName: isAdmin
          ? selectedCtv?.displayName
          : isCollaborator
            ? userData?.displayName || user?.displayName || 'Cộng tác viên'
            : undefined,
        ctvPhone: isAdmin
          ? selectedCtv?.phoneNumber
          : isCollaborator
            ? userData?.phoneNumber || ''
            : undefined,
        adminMode: isAdmin ? adminMode : undefined,
        createdByAdminId: isAdmin ? user?.uid : undefined,
      });

      Alert.alert('Thành công', 'Đã gửi yêu cầu đặt lịch.', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/bookings');
          },
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tạo lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loadingApt) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Hoteliq.ink} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={['bottom']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 32,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled">
            <View className="min-w-0 gap-1.5">
              <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
                {screenTitle}
              </Text>
              <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
                {isGuest
                  ? 'Khách vãng lai · không cần tài khoản'
                  : `Vai trò: ${roleLabel ?? '—'}`}
                {apartment?.sourceCode ? ` · Mã căn ${apartment.sourceCode}` : ''}
              </Text>
            </View>

            {isAdmin ? (
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => setAdminMode('personal')}
                  className={`min-h-11 flex-1 items-center justify-center rounded-full px-3 ${
                    adminMode === 'personal' ? 'bg-hoteliq-ink' : 'bg-hoteliq-chip'
                  }`}>
                  <Text
                    className={`text-[13px] font-semibold ${
                      adminMode === 'personal'
                        ? 'text-white'
                        : 'text-hoteliq-ink'
                    }`}>
                    Lịch cá nhân
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAdminMode('assign_ctv')}
                  className={`min-h-11 flex-1 items-center justify-center rounded-full px-3 ${
                    adminMode === 'assign_ctv'
                      ? 'bg-hoteliq-ink'
                      : 'bg-hoteliq-chip'
                  }`}>
                  <Text
                    className={`text-[13px] font-semibold ${
                      adminMode === 'assign_ctv'
                        ? 'text-white'
                        : 'text-hoteliq-ink'
                    }`}>
                    Gán cho CTV
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {isAdmin && adminMode === 'assign_ctv' ? (
              <View className="gap-2">
                <Text className="text-[12px] font-semibold leading-4 text-hoteliq-gray">
                  Chọn CTV *
                </Text>
                <TextInput
                  placeholder="Tìm tên hoặc SĐT CTV"
                  placeholderTextColor={Hoteliq.mutedLight}
                  value={ctvSearch}
                  onChangeText={setCtvSearch}
                  className="min-h-[48px] rounded-[12px] border border-hoteliq-line bg-white px-4 text-[15px] text-hoteliq-ink"
                />
                {loadingCtv ? (
                  <ActivityIndicator color={Hoteliq.primary} />
                ) : (
                  <View className="gap-2">
                    {filteredCtv.slice(0, 8).map((ctv) => {
                      const selected = selectedCtv?.uid === ctv.uid;
                      return (
                        <Pressable
                          key={ctv.uid}
                          onPress={() => setSelectedCtv(ctv)}
                          className={`gap-0.5 rounded-[12px] border px-4 py-3 ${
                            selected
                              ? 'border-hoteliq-ink bg-hoteliq-soft'
                              : 'border-hoteliq-line bg-white'
                          }`}>
                          <Text className="text-[14px] font-semibold text-hoteliq-ink">
                            {ctv.displayName}
                          </Text>
                          <Text className="text-[12px] leading-4 text-hoteliq-gray">
                            {ctv.phoneNumber || 'Chưa có SĐT'}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {filteredCtv.length === 0 ? (
                      <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
                        Không tìm thấy CTV.
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            {isCollaborator || (isAdmin && adminMode === 'assign_ctv') ? (
              <>
                <Field
                  label="Tên khách *"
                  value={clientName}
                  onChangeText={setClientName}
                />
                <Field
                  label="SĐT khách *"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  keyboardType="phone-pad"
                />
                <Field
                  label={isCollaborator ? 'Giá tư vấn *' : 'Giá tư vấn'}
                  value={consultationPrice}
                  onChangeText={setConsultationPrice}
                  placeholder="Giá báo khách..."
                />
                <Field
                  label="Nhu cầu / ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="VD: 8-10tr, có pet..."
                />
              </>
            ) : isAdmin && adminMode === 'personal' ? (
              <>
                <Field
                  label="Tên khách *"
                  value={clientName}
                  onChangeText={setClientName}
                />
                <Field
                  label="SĐT khách *"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="VD: 5-7 triệu"
                />
              </>
            ) : (
              <>
                <Field
                  label="Họ và tên *"
                  value={name}
                  onChangeText={setName}
                />
                <Field
                  label="Số điện thoại *"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  placeholder="VD: 5-7 triệu"
                />
              </>
            )}

            <Field
              label="Ngày xem *"
              value={bookingDate}
              onChangeText={setBookingDate}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="Giờ xem (tuỳ chọn)"
              value={bookingTime}
              onChangeText={setBookingTime}
              placeholder="HH:mm"
            />
            <Field
              label="Ghi chú / nhu cầu cụ thể"
              value={notes}
              onChangeText={setNotes}
              placeholder={
                isCollaborator
                  ? 'Tài chính, xe điện, pet...'
                  : 'Yêu cầu đặc biệt (pet, chỗ để oto...)'
              }
              multiline
            />
          </ScrollView>

          {/* Sticky submit CTA */}
          <View className="border-t border-hoteliq-line bg-white px-6 pb-2 pt-3">
            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              className="h-12 items-center justify-center rounded-full bg-hoteliq-primary"
              style={({ pressed }) => ({
                opacity: pressed || submitting ? 0.7 : 1,
              })}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  Xác nhận tạo lịch
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
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
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-semibold leading-4 text-hoteliq-gray">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Hoteliq.mutedLight}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-[12px] border bg-white px-4 text-[15px] text-hoteliq-ink ${
          multiline ? 'min-h-[96px] py-3' : 'min-h-[48px] py-3'
        } ${focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}
