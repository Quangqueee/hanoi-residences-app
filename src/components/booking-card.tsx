import { Pressable, Text, View } from 'react-native';

import {
  CTV_BOOKINGS_COLLECTION,
  GUEST_CONSULTATIONS_COLLECTION,
  USER_BOOKINGS_COLLECTION,
  formatBookingTimeDisplay,
  getBookingCustomer,
  getStatusMeta,
  type BookingRecord,
} from '@/lib/bookings-service';

type Props = {
  booking: BookingRecord;
  onEdit: (booking: BookingRecord) => void;
  showSource?: boolean;
};

function sourceLabel(collection: BookingRecord['_collection']): string {
  switch (collection) {
    case CTV_BOOKINGS_COLLECTION:
      return 'CTV';
    case GUEST_CONSULTATIONS_COLLECTION:
      return 'Vãng lai';
    case USER_BOOKINGS_COLLECTION:
    default:
      return 'Khách';
  }
}

export function BookingCard({ booking, onEdit, showSource }: Props) {
  const status = getStatusMeta(booking.status);
  const customer = getBookingCustomer(booking);
  const feedback = booking.adminNotes?.trim();

  return (
    <View className="mb-4 overflow-hidden rounded-[12px] border border-hoteliq-line bg-white p-4">
      {/* Header: mã căn + status */}
      <View className="mb-4 flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
            Mã căn
            {showSource ? ` · ${sourceLabel(booking._collection)}` : ''}
          </Text>
          <Text
            className="text-[18px] font-semibold leading-6 text-hoteliq-ink"
            numberOfLines={1}>
            {booking.apartmentCode || 'N/A'}
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{
            backgroundColor: status.bg,
          }}>
          <Text
            className="text-[12px] font-semibold leading-4"
            style={{ color: status.text }}>
            {status.label}
          </Text>
        </View>
      </View>

      {/* Body: khách + giờ xem */}
      <View className="mb-4 flex-row gap-4">
        <View className="min-w-0 flex-1 gap-0.5">
          <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
            Khách hàng
          </Text>
          <Text
            className="text-[15px] font-semibold leading-5 text-hoteliq-ink"
            numberOfLines={2}>
            {customer.name}
          </Text>
          <Text className="text-[14px] leading-[18px] text-hoteliq-gray">
            {customer.phone}
          </Text>
        </View>

        <View className="max-w-[46%] items-end gap-0.5">
          <Text className="text-[12px] font-medium leading-4 text-hoteliq-gray">
            Giờ xem
          </Text>
          <Text
            className="text-right text-[14px] font-semibold leading-[18px] text-hoteliq-ink"
            numberOfLines={2}>
            {formatBookingTimeDisplay(booking.dateTime)}
          </Text>
        </View>
      </View>

      {/* Note / admin feedback */}
      {feedback ? (
        <View className="mb-4 flex-row items-start gap-2.5 rounded-[12px] bg-hoteliq-chip px-3.5 py-3">
          <Text className="text-sm text-hoteliq-gray">💬</Text>
          <Text className="min-w-0 flex-1 text-[13px] leading-5 text-hoteliq-ink">
            {feedback}
          </Text>
        </View>
      ) : booking.notes?.trim() ? (
        <View className="mb-4 rounded-[12px] bg-hoteliq-chip px-3.5 py-3">
          <Text className="text-[13px] leading-5 text-hoteliq-gray">
            {booking.notes.trim()}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => onEdit(booking)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Xem chi tiết và Chỉnh sửa"
        className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-full border border-hoteliq-line bg-white"
        style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        <Text className="text-sm text-hoteliq-ink">✎</Text>
        <Text className="text-[14px] font-semibold text-hoteliq-ink">
          Xem chi tiết và Chỉnh sửa
        </Text>
      </Pressable>
    </View>
  );
}
