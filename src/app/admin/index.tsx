import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  backfillSubmissionStatus,
  fetchAdminDashboardStats,
  type AdminDashboardStats,
} from '@/lib/admin-apartments-service';

function StatCard({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number | string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className="mb-3 w-[48%] rounded-[12px] border border-hoteliq-line bg-white p-4"
      style={({ pressed }) => ({ opacity: pressed && onPress ? 0.85 : 1 })}>
      <Text className="text-[13px] text-hoteliq-gray">{label}</Text>
      <Text className="mt-1 text-[26px] font-semibold text-hoteliq-ink">
        {value}
      </Text>
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      setStats(await fetchAdminDashboardStats());
    } catch (err) {
      console.error(err);
      setMessage('Không tải được thống kê.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load('initial');
  }, [authLoading, isAdmin, load]);

  if (!authLoading && !user) return <Redirect href="/(auth)/login" />;
  if (!authLoading && !isAdmin) return <Redirect href="/(tabs)/profile" />;

  const onBackfill = () => {
    void (async () => {
      setBusy(true);
      setMessage(null);
      try {
        const n = await backfillSubmissionStatus();
        setMessage(`Backfill xong: ${n} tin thiếu submissionStatus → published.`);
      } catch {
        setMessage('Backfill thất bại.');
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Admin tổng quan
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Đóng
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }>
        {loading || !stats ? (
          <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
        ) : (
          <View className="flex-row flex-wrap justify-between">
            <StatCard
              label="Căn hộ"
              value={stats.totalApartments}
              onPress={() => router.push('/admin/apartments')}
            />
            <StatCard label="Users" value={stats.totalUsers} onPress={() => router.push('/admin/users')} />
            <StatCard
              label="Lịch chờ duyệt"
              value={stats.pendingBookings}
              onPress={() => router.push('/(tabs)/bookings')}
            />
            <StatCard
              label="CTV chờ duyệt"
              value={stats.pendingCtvRequests}
              onPress={() => router.push('/admin/users')}
            />
            <StatCard
              label="Tin chờ duyệt"
              value={stats.pendingSubmissions}
              onPress={() => router.push('/admin/submissions')}
            />
          </View>
        )}

        <View className="mt-6 gap-2">
          <Text className="mb-1 text-[14px] font-semibold text-hoteliq-ink">
            Lối tắt
          </Text>
          {[
            { label: 'Quản lý căn hộ', href: '/admin/apartments' as const },
            { label: 'Duyệt tin chủ nhà', href: '/admin/submissions' as const },
            { label: 'Users / CTV', href: '/admin/users' as const },
            { label: 'Đối tác chủ nhà', href: '/admin/partners' as const },
          ].map((item) => (
            <Pressable
              key={item.href}
              onPress={() => router.push(item.href)}
              className="min-h-12 justify-center rounded-[12px] border border-hoteliq-line px-4">
              <Text className="text-[15px] font-semibold text-hoteliq-ink">
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          disabled={busy}
          onPress={onBackfill}
          className="mt-6 min-h-12 items-center justify-center rounded-full border border-hoteliq-line">
          {busy ? (
            <ActivityIndicator color={Hoteliq.ink} />
          ) : (
            <Text className="text-[14px] font-semibold text-hoteliq-ink">
              Backfill submissionStatus (A10)
            </Text>
          )}
        </Pressable>
        {message ? (
          <Text className="mt-3 text-center text-[13px] text-hoteliq-gray">
            {message}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
