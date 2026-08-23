import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function ApartmentIdLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="index"
        options={{
          contentStyle: { backgroundColor: '#FFFFFF' },
        }}
      />
      <Stack.Screen
        name="gallery"
        options={{
          presentation: 'fullScreenModal',
          animation: 'fade',
          gestureEnabled: true,
          contentStyle: { backgroundColor: '#000000' },
        }}
      />
    </Stack>
  );
}
