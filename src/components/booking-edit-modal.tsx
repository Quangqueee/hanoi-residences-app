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

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  CTV_BOOKINGS_COLLECTION,
  getStatusMeta,
  updateBooking,
  updateBookingAdminNotes,
  updateBookingStatus,
  type BookingRecord,
  type BookingStatus,
} from '@/lib/bookings-service';

const ADMIN_STATUSES: BookingStatus[] = [
  'pending',
  'approved',
  'contacted',
  'failed',
];

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

export function BookingEditModal({
  visible,
  booking,
  onClose,
  onSaved,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isAdmin } = useAuth();
  const isCtv = booking?._collection === CTV_BOOKINGS_COLLECTION;

  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');
  const [budget, setBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [status, setStatus] = useState<BookingStatus>('pending');
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
    setAdminNotes(booking.adminNotes || '');
    setStatus(booking.status || 'pending');
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

      let nextStatus = booking.status;
      let nextAdminNotes = booking.adminNotes || '';

      if (isAdmin) {
        if (status !== booking.status) {
          await updateBookingStatus({
            collectionName: booking._collection,
            bookingId: booking.id,
            status,
            booking,
          });
          nextStatus = status;
        }
        if (adminNotes.trim() !== (booking.adminNotes || '').trim()) {
          await updateBookingAdminNotes({
            collectionName: booking._collection,
            bookingId: booking.id,
            adminNotes,
            booking: { ...booking, status: nextStatus },
          });
          nextAdminNotes = adminNotes.trim();
        }
      }

      const next: BookingRecord = {
        ...booking,
        dateTime: bookingTime ? `${bookingDate}T${bookingTime}` : bookingDate,
        notes,
        budget,
        consultationPrice,
        status: nextStatus,
        adminNotes: nextAdminNotes,
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
        className="flex-1 rounded-t-[20px] bg-white"
        style={{ paddingTop: Math.max(insets.top, 8) }}>
        <View className="mb-1 h-1 w-10 self-center rounded-full bg-hoteliq-line" />
        <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 pb-3 pt-1">
          <Text className="text-[20px] font-semibold leading-7 text-hoteliq-ink">
            Chi tiết lịch hẹn
          </Text>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            disabled={saving}
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
              paddingVertical: 20,
              paddingBottom: 40 + insets.bottom,
              gap: 16,
            }}
            keyboardShouldPersistTaps="handled">
            <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
              Mã căn{' '}
              <Text className="font-semibold text-hoteliq-ink">
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
                className="min-h-[52px] flex-1 justify-center gap-0.5 rounded-[12px] border border-hoteliq-line bg-white px-4 py-2">
                <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
                  Ngày
                </Text>
                <Text className="text-[15px] font-semibold text-hoteliq-ink">
                  {bookingDate || 'Chọn ngày'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setPickerValue(parseDateTime(`${bookingDate}T${bookingTime || '09:00'}`).date);
                  setPickerMode('time');
                }}
                className="min-h-[52px] flex-1 justify-center gap-0.5 rounded-[12px] border border-hoteliq-line bg-white px-4 py-2">
                <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
                  Giờ
                </Text>
                <Text className="text-[15px] font-semibold text-hoteliq-ink">
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

            {isAdmin ? (
              <View className="gap-2">
                <Text className="text-[12px] font-semibold leading-4 text-hoteliq-gray">
                  Trạng thái (Admin)
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {ADMIN_STATUSES.map((s) => {
                    const meta = getStatusMeta(s);
                    const active = status === s;
                    return (
                      <Pressable
                        key={s}
                        onPress={() => setStatus(s)}
                        className="rounded-full border px-3 py-2"
                        style={{
                          backgroundColor: active ? meta.bg : '#FFFFFF',
                          borderColor: active ? meta.border : Hoteliq.line,
                        }}>
                        <Text
                          className="text-[12px] font-semibold"
                          style={{ color: active ? meta.text : Hoteliq.muted }}>
                          {meta.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Field
                  label="Ghi chú Ban quản trị"
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  multiline
                  placeholder="Phản hồi gửi cho khách / CTV…"
                />
              </View>
            ) : booking?.adminNotes?.trim() ? (
              <View className="rounded-[12px] bg-hoteliq-chip px-4 py-3">
                <Text className="mb-1 text-[12px] font-semibold leading-4 text-hoteliq-gray">
                  Phản hồi BQT
                </Text>
                <Text className="text-[14px] leading-5 text-hoteliq-ink">
                  {booking.adminNotes}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={() => void handleSave()}
              disabled={saving}
              className="mt-2 h-12 items-center justify-center rounded-full bg-hoteliq-primary"
              style={({ pressed }) => ({
                opacity: saving ? 0.7 : pressed ? 0.9 : 1,
              })}>
              {saving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="text-[15px] font-semibold text-white">
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
            className="items-center border-t border-hoteliq-line bg-white py-3"
            style={{ paddingBottom: insets.bottom || 12 }}>
            <Text className="text-[15px] font-semibold text-hoteliq-ink">Xong</Text>
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
