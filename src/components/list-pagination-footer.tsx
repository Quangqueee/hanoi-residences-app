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
  accentColor = '#CDA533',
}: Props) {
  if (loadingMore) {
    return (
      <View className="items-center gap-2 py-7">
        <ActivityIndicator color={accentColor} size="small" />
        <Text className="text-xs font-medium text-brand-muted">
          Đang tải thêm…
        </Text>
      </View>
    );
  }

  if (!hasMore && itemCount > 0) {
    return (
      <Text className="py-5 text-center text-[13px] font-medium text-brand-muted">
        Bạn đã xem hết danh sách
      </Text>
    );
  }

  return <View className="h-4" />;
}
