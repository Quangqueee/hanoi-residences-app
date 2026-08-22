import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
  approveCtvRequest,
  deleteUserProfileDoc,
  fetchAdminUsers,
  rejectCtvRequest,
  updateManageableUserRole,
  type AdminUserRecord,
} from '@/lib/partner-service';

type RoleFilter = 'all' | 'user' | 'collaborator' | 'landlord' | 'admin' | 'pending_ctv';

function roleLabel(role?: string) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'collaborator':
      return 'CTV';
    case 'landlord':
      return 'Chủ nhà';
    default:
      return 'User';
  }
}

export default function AdminUsersScreen() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    setError(null);
    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      console.error(err);
      setError('Không tải được danh sách người dùng.');
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
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        u.email?.toLowerCase().includes(q) ||
        u.displayName?.toLowerCase().includes(q) ||
        u.phoneNumber?.includes(q);

      const currentRole = u.role || 'user';
      let matchesRole = true;
      if (roleFilter === 'pending_ctv') {
        matchesRole = u.requestStatus === 'pending';
      } else if (roleFilter !== 'all') {
        matchesRole = currentRole === roleFilter;
      }
      return matchesQuery && matchesRole;
    });
  }, [users, search, roleFilter]);

  if (!authLoading && !user) {
    return <Redirect href="/(auth)/login" />;
  }
  if (!authLoading && !isAdmin) {
    return <Redirect href="/(tabs)/profile" />;
  }

  const onApprove = (u: AdminUserRecord) => {
    Alert.alert('Duyệt CTV', `Chuyển ${u.displayName || u.email} thành CTV?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Duyệt',
        onPress: () => {
          void (async () => {
            setBusyUid(u.uid);
            try {
              await approveCtvRequest(u.uid);
              setUsers((prev) =>
                prev.map((x) =>
                  x.uid === u.uid
                    ? { ...x, role: 'collaborator', requestStatus: undefined }
                    : x,
                ),
              );
              Alert.alert('Thành công', 'Đã duyệt CTV.');
            } catch {
              Alert.alert('Lỗi', 'Duyệt CTV thất bại.');
            } finally {
              setBusyUid(null);
            }
          })();
        },
      },
    ]);
  };

  const onReject = (u: AdminUserRecord) => {
    Alert.alert('Từ chối CTV', `Từ chối hồ sơ của ${u.displayName || u.email}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Từ chối',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyUid(u.uid);
            try {
              await rejectCtvRequest(u.uid);
              setUsers((prev) =>
                prev.map((x) =>
                  x.uid === u.uid ? { ...x, requestStatus: undefined } : x,
                ),
              );
              Alert.alert('Đã từ chối', 'Hồ sơ CTV đã được gỡ khỏi hàng chờ.');
            } catch {
              Alert.alert('Lỗi', 'Không từ chối được hồ sơ.');
            } finally {
              setBusyUid(null);
            }
          })();
        },
      },
    ]);
  };

  const onSetRole = (u: AdminUserRecord, next: 'user' | 'collaborator') => {
    if (u.role === 'admin' || u.role === 'landlord') return;
    Alert.alert(
      'Đổi vai trò',
      `Đặt ${u.displayName || u.email} thành ${next === 'collaborator' ? 'CTV' : 'User'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          onPress: () => {
            void (async () => {
              setBusyUid(u.uid);
              try {
                await updateManageableUserRole(u.uid, next);
                setUsers((prev) =>
                  prev.map((x) =>
                    x.uid === u.uid
                      ? { ...x, role: next, requestStatus: undefined }
                      : x,
                  ),
                );
              } catch {
                Alert.alert('Lỗi', 'Không cập nhật được vai trò.');
              } finally {
                setBusyUid(null);
              }
            })();
          },
        },
      ],
    );
  };

  const onDelete = (u: AdminUserRecord) => {
    if (u.role === 'admin') return;
    Alert.alert(
      'Xóa hồ sơ',
      `Xóa bản ghi hiển thị của ${u.email || u.uid}? Không xóa tài khoản Auth.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyUid(u.uid);
              try {
                await deleteUserProfileDoc(u.uid);
                setUsers((prev) => prev.filter((x) => x.uid !== u.uid));
                Alert.alert('Đã xóa', 'Bản ghi đã được gỡ khỏi danh sách.');
              } catch {
                Alert.alert('Lỗi', 'Xóa thất bại.');
              } finally {
                setBusyUid(null);
              }
            })();
          },
        },
      ],
    );
  };

  const filters: { key: RoleFilter; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'pending_ctv', label: 'Chờ CTV' },
    { key: 'user', label: 'User' },
    { key: 'collaborator', label: 'CTV' },
    { key: 'landlord', label: 'Chủ nhà' },
    { key: 'admin', label: 'Admin' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-row items-center justify-between border-b border-hoteliq-line px-6 py-3">
        <Text className="text-[20px] font-semibold text-hoteliq-ink">
          Quản lý users
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Đóng
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={{ padding: 24, paddingBottom: 40, flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="min-h-[48px] flex-row items-center rounded-full border border-hoteliq-line px-4">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tên, email, SĐT…"
                placeholderTextColor={Hoteliq.mutedLight}
                className="flex-1 py-3 text-[15px] text-hoteliq-ink"
              />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {filters.map((f) => {
                const active = roleFilter === f.key;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setRoleFilter(f.key)}
                    className={`rounded-full border px-3 py-2 ${
                      active
                        ? 'border-hoteliq-ink bg-hoteliq-ink'
                        : 'border-hoteliq-line bg-white'
                    }`}>
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? 'text-white' : 'text-hoteliq-gray'
                      }`}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text className="text-[13px] text-hoteliq-gray">
              {filtered.length} người dùng
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = busyUid === item.uid;
          const pending = item.requestStatus === 'pending';
          const locked = item.role === 'admin' || item.role === 'landlord';
          return (
            <View className="mb-3 rounded-[12px] border border-hoteliq-line bg-white p-4">
              <View className="mb-2 flex-row items-start justify-between gap-2">
                <View className="min-w-0 flex-1">
                  <Text
                    className="text-[16px] font-semibold text-hoteliq-ink"
                    numberOfLines={1}>
                    {item.displayName || 'Chưa đặt tên'}
                  </Text>
                  <Text className="text-[13px] text-hoteliq-gray" numberOfLines={1}>
                    {item.email || '—'}
                  </Text>
                  {item.phoneNumber ? (
                    <Text className="text-[13px] text-hoteliq-gray">
                      {item.phoneNumber}
                    </Text>
                  ) : null}
                </View>
                <View className="rounded-full bg-hoteliq-chip px-2.5 py-1">
                  <Text className="text-[11px] font-semibold text-hoteliq-ink">
                    {roleLabel(item.role)}
                  </Text>
                </View>
              </View>

              {(item.ctvIntroduction || item.interests) && (
                <Text
                  className="mb-3 text-[13px] leading-5 text-hoteliq-gray"
                  numberOfLines={3}>
                  {item.ctvIntroduction || item.interests}
                </Text>
              )}

              {pending ? (
                <View className="mb-2 flex-row gap-2">
                  <Pressable
                    disabled={busy}
                    onPress={() => onApprove(item)}
                    className="min-h-10 flex-1 items-center justify-center rounded-full bg-hoteliq-ink">
                    {busy ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text className="text-[13px] font-semibold text-white">
                        Duyệt CTV
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    disabled={busy}
                    onPress={() => onReject(item)}
                    className="min-h-10 flex-1 items-center justify-center rounded-full border border-red-200 bg-red-50">
                    <Text className="text-[13px] font-semibold text-red-700">
                      Từ chối
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {!locked ? (
                <View className="gap-2">
                  <View className="flex-row gap-2">
                    <Pressable
                      disabled={busy || item.role === 'user'}
                      onPress={() => onSetRole(item, 'user')}
                      className="min-h-9 flex-1 items-center justify-center rounded-full border border-hoteliq-line">
                      <Text className="text-[12px] font-semibold text-hoteliq-ink">
                        → User
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={busy || item.role === 'collaborator'}
                      onPress={() => onSetRole(item, 'collaborator')}
                      className="min-h-9 flex-1 items-center justify-center rounded-full border border-hoteliq-line">
                      <Text className="text-[12px] font-semibold text-hoteliq-ink">
                        → CTV
                      </Text>
                    </Pressable>
                  </View>
                  <Pressable
                    disabled={busy}
                    onPress={() => onDelete(item)}
                    className="min-h-9 items-center justify-center rounded-full border border-red-200">
                    <Text className="text-[12px] font-semibold text-red-700">
                      Xóa hồ sơ
                    </Text>
                  </Pressable>
                </View>
              ) : item.role === 'landlord' ? (
                <Text className="text-[12px] text-amber-700">
                  Quản lý tại tab Đối tác
                </Text>
              ) : (
                <Text className="text-[12px] text-red-600">Tài khoản quản trị</Text>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Hoteliq.primary} className="mt-10" />
          ) : (
            <Text className="mt-8 text-center text-[14px] text-hoteliq-gray">
              {error || 'Không có người dùng phù hợp.'}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}
