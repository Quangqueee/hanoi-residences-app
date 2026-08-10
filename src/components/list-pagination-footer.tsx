import { ActivityIndicator, Text, View } from 'react-native';

type Props = {
  loadingMore: boolean;
  hasMore: boolean;
  itemCount: number;
  accentColor?: string;
};

/** Subtle end-of-list / load-more footer for apartment feeds. */
export function ListPaginationFooter({
  loadingMore,
  hasMore,
  itemCount,
  accentColor = '#0A0A0A',
}: Props) {
  if (loadingMore) {
    return (
      <View className="items-center gap-2 py-7">
        <ActivityIndicator color={accentColor} size="small" />
        <Text className="text-xs text-hoteliq-gray">Đang tải thêm…</Text>
      </View>
    );
  }

  if (!hasMore && itemCount > 0) {
    return (
      <Text className="py-5 text-center text-[13px] text-hoteliq-gray">
        Bạn đã xem hết danh sách
      </Text>
    );
  }

  return <View className="h-4" />;
}
