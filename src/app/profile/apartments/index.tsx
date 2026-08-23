import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LandlordApartmentsPanel } from '@/components/landlord-apartments-panel';
import { useAuth } from '@/contexts/auth-context';

export default function LandlordApartmentsScreen() {
  const { user, isLandlord, loading: authLoading } = useAuth();

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!authLoading && !isLandlord) {
    return <Redirect href="/partner-register" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <LandlordApartmentsPanel variant="stack" />
    </SafeAreaView>
  );
}
