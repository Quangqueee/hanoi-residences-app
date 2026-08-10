import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  createBooking,
  fetchCollaborators,
  type AdminBookingMode,
  type CollaboratorOption,
} from '@/lib/bookings-service';
import type { Apartment } from '@/lib/types';

type Props = {
  visible: boolean;
  apartment: Apartment;
  onClose: () => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toHm(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  editable = true,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
  editable?: boolean;
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
        editable={editable}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-[12px] border bg-white px-4 text-[15px] text-hoteliq-ink ${
          multiline ? 'min-h-[96px] py-3' : 'min-h-[48px] py-3'
        } ${focused ? 'border-hoteliq-ink' : 'border-hoteliq-line'} ${
          !editable ? 'opacity-60' : ''
        }`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export function BookingModal({ visible, apartment, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { user, userData, role, isAdmin, isCollaborator } = useAuth();

  const isGuest = !user;
  const isLeadForm = isCollaborator || isAdmin;

  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [name, setName] = useState(userData?.displayName || '');
  const [phone, setPhone] = useState(userData?.phoneNumber || '');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');
  const [adminMode, setAdminMode] = useState<AdminBookingMode>('personal');
  const [ctvList, setCtvList] = useState<CollaboratorOption[]>([]);
  const [ctvSearch, setCtvSearch] = useState('');
  const [selectedCtv, setSelectedCtv] = useState<CollaboratorOption | null>(
    null,
  );
  const [loadingCtv, setLoadingCtv] = useState(false);

  const [bookingDate, setBookingDate] = useState(toYmd(new Date()));
  const [bookingTime, setBookingTime] = useState('');
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  const title = isGuest
    ? 'Đặt lịch tư vấn'
    : isAdmin
      ? 'Thêm lịch cho căn này'
      : isCollaborator
        ? 'Đặt lịch dẫn khách'
        : 'Đặt lịch xem phòng';

  useEffect(() => {
    if (!visible) return;
    setName(userData?.displayName || '');
    setPhone(userData?.phoneNumber || '');
  }, [visible, userData?.displayName, userData?.phoneNumber]);

  useEffect(() => {
    if (!visible || !isAdmin) return;
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
  }, [visible, isAdmin]);

  const filteredCtv = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase();
    if (!q) return ctvList;
    return ctvList.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q),
    );
  }, [ctvList, ctvSearch]);

  const resetForm = () => {
    setBookingDate(toYmd(new Date()));
    setBookingTime('');
    setNotes('');
    setBudget('');
    setClientName('');
    setClientPhone('');
    setConsultationPrice('');
    setAdminMode('personal');
    setCtvSearch('');
    setSelectedCtv(null);
    setPickerMode(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;
    setPickerValue(selected);
    if (pickerMode === 'date') setBookingDate(toYmd(selected));
    if (pickerMode === 'time') setBookingTime(toHm(selected));
  };

  const onSubmit = async () => {
    if (role === 'landlord') {
      Alert.alert(
        'Không hỗ trợ',
        'Tài khoản chủ nhà không thể tạo lịch hẹn từ app.',
      );
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng chọn ngày xem phòng.');
      return;
    }

    if (isLeadForm) {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert('Thiếu thông tin khách', 'Vui lòng nhập tên và SĐT khách.');
        return;
      }
      if (
        !consultationPrice.trim() &&
        (isCollaborator || adminMode === 'assign_ctv')
      ) {
        Alert.alert('Thiếu giá tư vấn', 'Vui lòng nhập giá tư vấn báo khách.');
        return;
      }
    } else if (!name.trim() || !phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại.');
      return;
    }

    if (isAdmin && adminMode === 'assign_ctv' && !selectedCtv) {
      Alert.alert('Chưa chọn CTV', 'Vui lòng chọn một CTV để gán lịch.');
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        role: isGuest ? null : role,
        isGuest,
        apartmentId: apartment.id,
        apartmentCode: apartment.sourceCode,
        apartmentTitle: apartment.title,
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
            resetForm();
            onClose();
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <View
        className="flex-1 rounded-t-[20px] bg-white"
        style={{ paddingTop: Math.max(insets.top, 8) }}>
        <View className="mb-1 h-1 w-10 self-center rounded-full bg-hoteliq-line" />
        <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 pb-3 pt-1">
          <View className="min-w-0 flex-1 pr-3">
            <Text className="text-[20px] font-semibold leading-7 text-hoteliq-ink">
              {title}
            </Text>
            <Text
              className="mt-0.5 text-[13px] font-medium text-hoteliq-gray"
              numberOfLines={1}>
              {apartment.sourceCode
                ? `Mã căn ${apartment.sourceCode}`
                : apartment.title}
            </Text>
          </View>
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            disabled={submitting}
            className="min-h-[44px] justify-center">
            <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
              Đóng
            </Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 16,
              paddingBottom: 28 + insets.bottom,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled">
            {isGuest ? (
              <View className="rounded-[12px] bg-hoteliq-chip px-4 py-3">
                <Text className="text-[13px] leading-5 text-hoteliq-gray">
                  Bạn đang đặt lịch với tư cách khách vãng lai. Thông tin sẽ được
                  gửi tới ban quản trị để liên hệ tư vấn.
                </Text>
              </View>
            ) : null}

            {isAdmin ? (
              <View className="flex-row gap-2">
                {(
                  [
                    { key: 'personal', label: 'Khách riêng' },
                    { key: 'assign_ctv', label: 'Gán CTV' },
                  ] as const
                ).map((opt) => {
                  const selected = adminMode === opt.key;
                  return (
                    <Pressable
                      key={opt.key}
                      onPress={() => setAdminMode(opt.key)}
                      className={`min-h-11 flex-1 items-center justify-center rounded-full px-3 ${
                        selected ? 'bg-hoteliq-ink' : 'bg-hoteliq-chip'
                      }`}>
                      <Text
                        className={`text-[13px] font-semibold ${
                          selected ? 'text-white' : 'text-hoteliq-ink'
                        }`}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {isLeadForm ? (
              <>
                <FormField
                  label="Tên khách hàng"
                  value={clientName}
                  onChangeText={setClientName}
                  placeholder="Nhập tên khách thực tế"
                />
                <FormField
                  label="Số điện thoại khách"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  placeholder="09…"
                  keyboardType="phone-pad"
                />
                <FormField
                  label="Giá tư vấn báo khách"
                  value={consultationPrice}
                  onChangeText={setConsultationPrice}
                  placeholder="VD: 12"
                  keyboardType="decimal-pad"
                />
              </>
            ) : (
              <>
                <FormField
                  label="Họ và tên"
                  value={name}
                  onChangeText={setName}
                  placeholder="Nguyễn Văn A"
                />
                <FormField
                  label="Số điện thoại"
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="09…"
                  keyboardType="phone-pad"
                />
              </>
            )}

            <FormField
              label="Ngân sách (tuỳ chọn)"
              value={budget}
              onChangeText={setBudget}
              placeholder="VD: 10–15 triệu"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setPickerValue(new Date(`${bookingDate}T${bookingTime || '09:00'}:00`));
                  setPickerMode('date');
                }}
                className="min-h-[52px] flex-1 justify-center gap-0.5 rounded-[12px] border border-hoteliq-line bg-white px-4 py-2">
                <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
                  Ngày xem
                </Text>
                <Text className="text-[15px] font-semibold text-hoteliq-ink">
                  {bookingDate}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPickerValue(new Date(`${bookingDate}T${bookingTime || '09:00'}:00`));
                  setPickerMode('time');
                }}
                className="min-h-[52px] flex-1 justify-center gap-0.5 rounded-[12px] border border-hoteliq-line bg-white px-4 py-2">
                <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
                  Giờ xem
                </Text>
                <Text className="text-[15px] font-semibold text-hoteliq-ink">
                  {bookingTime || 'Cả ngày'}
                </Text>
              </Pressable>
            </View>

            {isAdmin && adminMode === 'assign_ctv' ? (
              <View className="gap-2">
                <Text className="text-[12px] font-semibold leading-4 text-hoteliq-gray">
                  Chọn CTV
                </Text>
                <TextInput
                  value={ctvSearch}
                  onChangeText={setCtvSearch}
                  placeholder="Tìm CTV theo tên / SĐT"
                  placeholderTextColor={Hoteliq.mutedLight}
                  className="min-h-[48px] rounded-[12px] border border-hoteliq-line bg-white px-4 text-[15px] text-hoteliq-ink"
                />
                {loadingCtv ? (
                  <ActivityIndicator color={Hoteliq.primary} />
                ) : (
                  <View className="max-h-40 overflow-hidden rounded-[12px] border border-hoteliq-line bg-white">
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {filteredCtv.map((ctv) => {
                        const selected = selectedCtv?.uid === ctv.uid;
                        return (
                          <Pressable
                            key={ctv.uid}
                            onPress={() => setSelectedCtv(ctv)}
                            className={`border-b border-hoteliq-chip px-4 py-3 ${
                              selected ? 'bg-hoteliq-soft' : 'bg-white'
                            }`}>
                            <Text className="text-[14px] font-semibold text-hoteliq-ink">
                              {ctv.displayName}
                            </Text>
                            <Text className="text-[12px] text-hoteliq-gray">
                              {ctv.phoneNumber || 'Chưa có SĐT'}
                            </Text>
                          </Pressable>
                        );
                      })}
                      {filteredCtv.length === 0 ? (
                        <Text className="px-4 py-3 text-[14px] text-hoteliq-gray">
                          Không tìm thấy CTV
                        </Text>
                      ) : null}
                    </ScrollView>
                  </View>
                )}
              </View>
            ) : null}

            <FormField
              label="Ghi chú"
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Yêu cầu thêm / lưu ý dẫn khách…"
            />

            <Pressable
              onPress={() => void onSubmit()}
              disabled={submitting}
              className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-primary"
              style={({ pressed }) => ({
                opacity: submitting ? 0.75 : pressed ? 0.92 : 1,
              })}>
              {submitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
                  Xác nhận đặt lịch
                </Text>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>

        {pickerMode ? (
          <DateTimePicker
            value={pickerValue}
            mode={pickerMode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onPickerChange}
            minimumDate={pickerMode === 'date' ? new Date() : undefined}
          />
        ) : null}

        {Platform.OS === 'ios' && pickerMode ? (
          <Pressable
            onPress={() => setPickerMode(null)}
            className="items-center border-t border-hoteliq-line bg-white py-3"
            style={{ paddingBottom: insets.bottom || 12 }}>
            <Text className="text-[15px] font-semibold text-hoteliq-ink">Xong</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}
