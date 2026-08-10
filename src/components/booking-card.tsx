import { Platform, Pressable, Text, View } from 'react-native';

import {
  formatBookingTimeDisplay,
  getBookingCustomer,
  getStatusMeta,
  type BookingRecord,
} from '@/lib/bookings-service';

type Props = {
  booking: BookingRecord;
  onEdit: (booking: BookingRecord) => void;
};

export function BookingCard({ booking, onEdit }: Props) {
  const status = getStatusMeta(booking.status);
  const customer = getBookingCustomer(booking);
  const feedback = booking.adminNotes?.trim();

  return (
    <View className="mb-5 overflow-hidden rounded-3xl bg-white px-5 pb-4 pt-5"
      style={
        Platform.select({
          ios: {
            shadowColor: '#1A1408',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.05,
            shadowRadius: 20,
          },
          android: { elevation: 2 },
          default: {},
        }) as object
      }>
      {/* Header: mã căn + status */}
      <View className="mb-5 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8A29A]">
            Mã căn
          </Text>
          <Text className="text-[20px] font-semibold tracking-tight text-brand">
            {booking.apartmentCode || 'N/A'}
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1.5"
          style={{
            backgroundColor: status.bg,
          }}>
          <Text
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: status.text }}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Body: khách + giờ xem */}
      <View className="mb-4 flex-row gap-4">
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8A29A]">
            Khách hàng
          </Text>
          <Text
            className="text-[17px] font-semibold leading-6 text-[#0C0A09]"
            numberOfLines={2}>
            {customer.name}
          </Text>
          <Text className="text-[14px] font-medium leading-5 text-brand-muted">
            {customer.phone}
          </Text>
        </View>

        <View className="max-w-[46%] items-end gap-1">
          <Text className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A8A29A]">
            Giờ xem
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Text className="text-xs text-brand">📅</Text>
            <Text
              className="text-right text-[13px] font-semibold leading-5 text-[#0C0A09]"
              numberOfLines={2}>
              {formatBookingTimeDisplay(booking.dateTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Note / admin feedback */}
      {feedback ? (
        <View className="mb-4 flex-row items-start gap-2.5 rounded-2xl bg-[#F3F8FF] px-3.5 py-3">
          <Text className="text-sm text-[#60A5FA]">💬</Text>
          <Text className="flex-1 text-[13px] leading-5 text-[#334155]">
            {feedback}
          </Text>
        </View>
      ) : booking.notes?.trim() ? (
        <View className="mb-4 rounded-2xl bg-[#F7F5F0] px-3.5 py-3">
          <Text className="text-[13px] leading-5 text-[#6B655C]">
            {booking.notes.trim()}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => onEdit(booking)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Xem chi tiết và Chỉnh sửa"
        className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl bg-[#FDFBF7]"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Text className="text-sm text-brand">✎</Text>
        <Text className="text-[13px] font-semibold text-brand">
          Xem chi tiết và Chỉnh sửa
        </Text>
      </Pressable>
    </View>
  );
}
