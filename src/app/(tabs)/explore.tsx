import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ThemedView
      style={[
        styles.container,
        { paddingTop: insets.top, backgroundColor: '#FFFFFF' },
      ]}>
      <View style={styles.safe}>
        <ThemedText type="subtitle">Khám phá</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Danh sách căn hộ, bộ lọc và sắp xếp sẽ được triển khai tại đây.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
});
