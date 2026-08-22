import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Hoteliq } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  deleteAdminApartment,
  fetchAllApartmentsForAdmin,
  pushApartment,
  pushApartmentsBatch,
} from '@/lib/admin-apartments-service';
import type { Apartment } from '@/lib/types';

export default function AdminApartmentsScreen() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      setApartments(await fetchAllApartmentsForAdmin());
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Không tải được danh sách căn hộ.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) void load('initial');
  }, [authLoading, isAdmin, load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return apartments;
    return apartments.filter(
      (a) =>
        a.title?.toLowerCase().includes(q) ||
        a.sourceCode?.toLowerCase().includes(q) ||
        a.district?.toLowerCase().includes(q) ||
        a.address?.toLowerCase().includes(q),
    );
  }, [apartments, search]);

  if (!authLoading && !user) return <Redirect href="/(auth)/login" />;
  if (!authLoading && !isAdmin) return <Redirect href="/(tabs)/profile" />;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onPushOne = (apt: Apartment) => {
    Alert.alert('Đẩy tin', `Đẩy "${apt.title}" lên đầu?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đẩy',
        onPress: () => {
          void (async () => {
            setBusyId(apt.id);
            try {
              await pushApartment(apt.id);
              await load('refresh');
              Alert.alert('OK', 'Đã đẩy tin.');
            } catch {
              Alert.alert('Lỗi', 'Không đẩy được tin.');
            } finally {
              setBusyId(null);
            }
          })();
        },
      },
    ]);
  };

  const onPushBatch = () => {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      Alert.alert('Chưa chọn', 'Chọn ít nhất một tin để đẩy hàng loạt.');
      return;
    }
    Alert.alert('Đẩy hàng loạt', `Đẩy ${ids.length} tin?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đẩy',
        onPress: () => {
          void (async () => {
            setBatchBusy(true);
            try {
              const n = await pushApartmentsBatch(ids);
              setSelected(new Set());
              await load('refresh');
              Alert.alert('OK', `Đã đẩy ${n} tin.`);
            } catch (err) {
              Alert.alert(
                'Lỗi',
                err instanceof Error ? err.message : 'Đẩy hàng loạt thất bại.',
              );
            } finally {
              setBatchBusy(false);
            }
          })();
        },
      },
    ]);
  };

  const onDelete = (apt: Apartment) => {
    if (!user) return;
    Alert.alert(
      'Xóa căn hộ',
      `Xóa "${apt.title}"? Có quota 10 lần/giờ. Ảnh Storage cũng bị xóa.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyId(apt.id);
              try {
                await deleteAdminApartment(user.uid, apt.id);
                setApartments((prev) => prev.filter((x) => x.id !== apt.id));
                setSelected((prev) => {
                  const next = new Set(prev);
                  next.delete(apt.id);
                  return next;
                });
              } catch (err) {
                Alert.alert(
                  'Lỗi',
                  err instanceof Error ? err.message : 'Xóa thất bại.',
                );
              } finally {
                setBusyId(null);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Quản lý căn hộ
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Đóng
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 24, paddingBottom: 120, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="min-h-[48px] rounded-full border border-hoteliq-line px-4">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tiêu đề, mã, quận…"
                placeholderTextColor={Hoteliq.mutedLight}
                className="py-3 text-[15px] text-hoteliq-ink"
              />
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={onPushBatch}
                disabled={batchBusy || selected.size === 0}
                className="min-h-10 flex-1 items-center justify-center rounded-full bg-hoteliq-ink px-3"
                style={{ opacity: selected.size === 0 ? 0.45 : 1 }}>
                {batchBusy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[12px] font-semibold text-white">
                    Đẩy đã chọn ({selected.size})
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push('/admin/apartments/form')}
                className="min-h-10 flex-1 items-center justify-center rounded-full border border-hoteliq-line px-3">
                <Text className="text-[12px] font-semibold text-hoteliq-ink">
                  + Thêm tin
                </Text>
              </Pressable>
            </View>
            <Text className="text-[13px] text-hoteliq-gray">
              {filtered.length} căn
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = busyId === item.id;
          const isSelected = selected.has(item.id);
          const thumb = item.imageUrls?.[0];
          return (
            <View className="mb-3 rounded-[12px] border border-hoteliq-line p-3">
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  className={`mt-1 h-6 w-6 items-center justify-center rounded border ${
                    isSelected
                      ? 'border-hoteliq-ink bg-hoteliq-ink'
                      : 'border-hoteliq-line'
                  }`}>
                  {isSelected ? (
                    <Text className="text-[12px] font-bold text-white">✓</Text>
                  ) : null}
                </Pressable>
                {thumb ? (
                  <Image
                    source={{ uri: thumb }}
                    className="h-16 w-16 rounded-[8px] bg-hoteliq-chip"
                  />
                ) : (
                  <View className="h-16 w-16 rounded-[8px] bg-hoteliq-chip" />
                )}
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[14px] font-semibold text-hoteliq-ink"
                    numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text className="text-[12px] text-hoteliq-gray">
                    {item.sourceCode || '—'} · {item.district} ·{' '}
                    {item.submissionStatus || '?'}
                  </Text>
                  {item.isPushRequested || item.pushRequestedAt ? (
                    <Text className="mt-0.5 text-[11px] font-semibold text-amber-700">
                      Xin đẩy
                    </Text>
                  ) : null}
                </View>
              </View>
              <View className="mt-2 flex-row flex-wrap gap-2">
                <Action
                  label="Sửa"
                  onPress={() =>
                    router.push({
                      pathname: '/admin/apartments/form',
                      params: { id: item.id },
                    })
                  }
                />
                <Action
                  label="Đẩy"
                  busy={busy}
                  onPress={() => onPushOne(item)}
                />
                <Action
                  label="Xóa"
                  destructive
                  busy={busy}
                  onPress={() => onDelete(item)}
                />
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
          ) : (
            <Text className="mt-8 text-center text-hoteliq-gray">
              Không có căn hộ.
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function Action({
  label,
  onPress,
  busy,
  destructive,
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  destructive?: boolean;
}) {
  return (
    <Pressable
      disabled={busy}
      onPress={onPress}
      className={`min-h-9 min-w-[72px] items-center justify-center rounded-full border px-3 ${
        destructive ? 'border-red-200' : 'border-hoteliq-line'
      }`}>
      {busy ? (
        <ActivityIndicator size="small" color={Hoteliq.ink} />
      ) : (
        <Text
          className={`text-[12px] font-semibold ${
            destructive ? 'text-red-700' : 'text-hoteliq-ink'
          }`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
