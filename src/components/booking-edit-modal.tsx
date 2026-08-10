import { useEffect, useState } from 'react';
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

import {
  CTV_BOOKINGS_COLLECTION,
  updateBooking,
  type BookingRecord,
} from '@/lib/bookings-service';

type Props = {
  visible: boolean;
  booking: BookingRecord | null;
  onClose: () => void;
  onSaved: (next: BookingRecord) => void;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function parseDateTime(dt?: string): { date: Date; hasTime: boolean } {
  const now = new Date();
  if (!dt) return { date: now, hasTime: false };
  try {
    if (dt.includes('T')) {
      const [d, t] = dt.split('T');
      const [y, m, day] = (d ?? '').split('-').map(Number);
      const [hh, mm] = (t ?? '00:00').split(':').map(Number);
      return {
        date: new Date(y!, (m ?? 1) - 1, day ?? 1, hh ?? 0, mm ?? 0),
        hasTime: true,
      };
    }
    const [y, m, day] = dt.split('-').map(Number);
    return {
      date: new Date(y!, (m ?? 1) - 1, day ?? 1),
      hasTime: false,
    };
  } catch {
    return { date: now, hasTime: false };
  }
}

function toYmd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toHm(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  keyboardType?: 'default' | 'phone-pad' | 'decimal-pad';
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-bold uppercase tracking-wide text-[#6B7280]">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`rounded-2xl border-[1.5px] bg-white px-4 text-base font-semibold text-[#111827] ${
          multiline ? 'min-h-[96px] py-3' : 'min-h-[52px] py-3'
        } ${focused ? 'border-brand' : 'border-[#E5E7EB]'}`}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

export function BookingEditModal({
  visible,
  booking,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const isCtv = booking?._collection === CTV_BOOKINGS_COLLECTION;

  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');

  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [pickerValue, setPickerValue] = useState(new Date());

  useEffect(() => {
    if (!visible || !booking) return;
    const parsed = parseDateTime(booking.dateTime);
    setBookingDate(toYmd(parsed.date));
    setBookingTime(parsed.hasTime ? toHm(parsed.date) : '');
    setClientName(booking.clientName || '');
    setClientPhone(booking.clientPhone || '');
    setName(booking.name || '');
    setPhone(booking.phone || '');
    setConsultationPrice(booking.consultationPrice || '');
    setBudget(booking.budget || '');
    setNotes(booking.notes || '');
    setPickerValue(parsed.date);
  }, [visible, booking]);

  const onPickerChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setPickerMode(null);
    if (event.type === 'dismissed' || !selected) return;
    setPickerValue(selected);
    if (pickerMode === 'date') setBookingDate(toYmd(selected));
    if (pickerMode === 'time') setBookingTime(toHm(selected));
  };

  const handleSave = async () => {
    if (!booking) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      Alert.alert('Ngày không hợp lệ', 'Vui lòng chọn ngày hợp lệ.');
      return;
    }
    setSaving(true);
    try {
      await updateBooking({
        collectionName: booking._collection,
        bookingId: booking.id,
        bookingDate,
        bookingTime: bookingTime || undefined,
        notes,
        budget,
        consultationPrice,
        name,
        phone,
        clientName,
        clientPhone,
      });

      const next: BookingRecord = {
        ...booking,
        dateTime: bookingTime ? `${bookingDate}T${bookingTime}` : bookingDate,
        notes,
        budget,
        consultationPrice,
        ...(isCtv
          ? { clientName, clientPhone }
          : { name, phone }),
        updatedAt: TimestampLikeNow(),
      };
      onSaved(next);
      Alert.alert('Thành công', 'Đã cập nhật lịch hẹn.');
      onClose();
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không cập nhật được lịch. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View
        className="flex-1 bg-background"
        style={{ paddingTop: Math.max(insets.top, 8) }}>
        <View className="flex-row items-center justify-between border-b border-black/[0.06] px-5 pb-3">
          <Text className="text-xl font-extrabold text-[#111827]">
            Chi tiết lịch hẹn
          </Text>
          <Pressable onPress={onClose} hitSlop={12} disabled={saving}>
            <Text className="text-base font-bold text-brand-muted">Đóng</Text>
          </Pressable>
        </View>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              padding: 20,
              paddingBottom: 40 + insets.bottom,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled">
            <Text className="text-sm font-semibold text-brand-muted">
              Mã căn{' '}
              <Text className="font-extrabold text-brand">
                {booking?.apartmentCode || 'N/A'}
              </Text>
            </Text>

            {isCtv ? (
              <>
                <Field
                  label="Tên khách hàng"
                  value={clientName}
                  onChangeText={setClientName}
                />
                <Field
                  label="SĐT khách"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  keyboardType="phone-pad"
                />
              </>
            ) : (
              <>
                <Field label="Họ tên" value={name} onChangeText={setName} />
                <Field
                  label="Số điện thoại"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </>
            )}

            <Field
              label="Giá tư vấn / Ngân sách"
              value={consultationPrice || budget}
              onChangeText={(t) => {
                setConsultationPrice(t);
                setBudget(t);
              }}
              keyboardType="decimal-pad"
              placeholder="VD: 12"
            />

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setPickerValue(parseDateTime(`${bookingDate}T${bookingTime || '09:00'}`).date);
                  setPickerMode('date');
                }}
                className="min-h-[52px] flex-1 justify-center rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white px-4">
                <Text className="text-[11px] font-bold uppercase text-[#9CA3AF]">
                  Ngày
                </Text>
                <Text className="text-base font-bold text-[#111827]">
                  {bookingDate || 'Chọn ngày'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPickerValue(parseDateTime(`${bookingDate}T${bookingTime || '09:00'}`).date);
                  setPickerMode('time');
                }}
                className="min-h-[52px] flex-1 justify-center rounded-2xl border-[1.5px] border-[#E5E7EB] bg-white px-4">
                <Text className="text-[11px] font-bold uppercase text-[#9CA3AF]">
                  Giờ
                </Text>
                <Text className="text-base font-bold text-[#111827]">
                  {bookingTime || 'Cả ngày'}
                </Text>
              </Pressable>
            </View>

            <Field
              label="Ghi chú"
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder="Ghi chú thêm…"
            />

            {booking?.adminNotes?.trim() ? (
              <View className="rounded-2xl bg-[#EFF6FF] px-4 py-3">
                <Text className="mb-1 text-[11px] font-bold uppercase text-[#3B82F6]">
                  Phản hồi BQT
                </Text>
                <Text className="text-sm leading-5 text-[#1E3A5F]">
                  {booking.adminNotes}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              className="mt-2 min-h-14 items-center justify-center rounded-[28px] bg-brand"
              style={({ pressed }) => ({
                opacity: saving ? 0.7 : pressed ? 0.9 : 1,
              })}>
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-base font-bold text-white">
                  Lưu thay đổi
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
          />
        ) : null}

        {Platform.OS === 'ios' && pickerMode ? (
          <Pressable
            onPress={() => setPickerMode(null)}
            className="items-center border-t border-[#E5E7EB] bg-white py-3"
            style={{ paddingBottom: insets.bottom || 12 }}>
            <Text className="text-base font-bold text-brand">Xong</Text>
          </Pressable>
        ) : null}
      </View>
    </Modal>
  );
}

function TimestampLikeNow() {
  const seconds = Math.floor(Date.now() / 1000);
  return {
    seconds,
    toMillis: () => seconds * 1000,
  };
}
