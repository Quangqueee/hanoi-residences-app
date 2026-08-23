import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BookingCard } from '@/components/booking-card';
import { BookingEditModal } from '@/components/booking-edit-modal';
import { LandlordApartmentsPanel } from '@/components/landlord-apartments-panel';
import { ShimmerBlock } from '@/components/ui/shimmer-block';
import { Hoteliq, HoteliqShadow, TAB_BAR_BODY_HEIGHT } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import {
  CTV_BOOKINGS_COLLECTION,
  GUEST_CONSULTATIONS_COLLECTION,
  USER_BOOKINGS_COLLECTION,
  fetchAdminAllBookings,
  fetchMyBookings,
  type BookingCollection,
  type BookingRecord,
  type BookingStatus,
} from '@/lib/bookings-service';
import { SITE_ORIGIN } from '@/lib/share-apartment';

type AdminScope = 'mine' | 'all';
type CollectionFilter = 'all' | BookingCollection;
type StatusFilter = 'all' | BookingStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'approved', label: 'Đã duyệt' },
  { key: 'contacted', label: 'Đã dẫn khách' },
  { key: 'failed', label: 'Không thành công' },
];

const COLLECTION_FILTERS: { key: CollectionFilter; label: string }[] = [
  { key: 'all', label: 'Mọi nguồn' },
  { key: USER_BOOKINGS_COLLECTION, label: 'Khách' },
  { key: CTV_BOOKINGS_COLLECTION, label: 'CTV' },
  { key: GUEST_CONSULTATIONS_COLLECTION, label: 'Vãng lai' },
];

function BookingSkeleton() {
  return (
    <View className="mb-4 overflow-hidden rounded-[12px] border border-hoteliq-line bg-white p-4">
      <View className="mb-4 flex-row justify-between">
        <ShimmerBlock className="h-10 w-24 rounded-md" height={40} width={96} />
        <ShimmerBlock className="h-7 w-24 rounded-full" height={28} width={96} />
      </View>
      <ShimmerBlock className="mb-2 h-5 w-[55%] rounded-md" height={20} width="55%" />
      <ShimmerBlock className="mb-4 h-4 w-[35%] rounded-md" height={16} width="35%" />
      <ShimmerBlock className="h-11 w-full rounded-full" height={44} width="100%" />
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      className={`rounded-full border px-3 py-2 ${
        active
          ? 'border-hoteliq-ink bg-hoteliq-ink'
          : 'border-hoteliq-line bg-white'
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
      <Text
        className={`text-[12px] font-semibold ${
          active ? 'text-white' : 'text-hoteliq-gray'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function BookingsScreen() {
  const { user, isLandlord, isAdmin, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (authLoading) {
    return <View className="flex-1 bg-white" />;
  }

  if (!user) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
        <View
          className="flex-1 justify-center px-6"
          style={{ paddingBottom: TAB_BAR_BODY_HEIGHT + insets.bottom + 16 }}>
          <View className="items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-10">
            <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
              Đăng nhập để xem lịch hẹn
            </Text>
            <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
              Khách chưa có tài khoản vẫn đặt tư vấn từ trang chi tiết căn hộ.
              Lịch đã gửi chỉ hiện sau khi đăng nhập.
            </Text>
            <Link href="/(auth)/login" asChild>
              <Pressable
                accessibilityRole="button"
                className="mt-1 h-12 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-7"
                style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                <Text className="text-sm font-semibold text-white">
                  Đăng nhập
                </Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </View>
    );
  }

  if (isLandlord && !isAdmin) {
    return <LandlordApartmentsPanel variant="tab" />;
  }

  return <BookingsList />;
}

function BookingsList() {
  const insets = useSafeAreaInsets();
  const { user, role, isCollaborator, isAdmin, loading: authLoading } =
    useAuth();

  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [adminScope, setAdminScope] = useState<AdminScope>('all');
  const [collectionFilter, setCollectionFilter] =
    useState<CollectionFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [editOpen, setEditOpen] = useState(false);
  const [selected, setSelected] = useState<BookingRecord | null>(null);

  const title = isAdmin
    ? 'Quản lý lịch hẹn'
    : isCollaborator
      ? 'Quản lý lịch dẫn khách'
      : 'Quản lý lịch xem phòng';

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!user) {
        setBookings([]);
        setLoading(false);
        return;
      }
      if (mode === 'initial') setLoading(true);
      if (mode === 'refresh') setRefreshing(true);
      setError(null);
      try {
        const data =
          isAdmin && adminScope === 'all'
            ? await fetchAdminAllBookings()
            : await fetchMyBookings({ uid: user.uid, role });
        setBookings(data);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : 'Không tải được danh sách lịch hẹn.',
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user, role, isAdmin, adminScope],
  );

  useEffect(() => {
    if (authLoading) return;
    void load('initial');
  }, [authLoading, load]);

  const filtered = useMemo(() => {
    let list = bookings;

    if (isAdmin) {
      if (collectionFilter !== 'all') {
        list = list.filter((b) => b._collection === collectionFilter);
      }
      if (statusFilter !== 'all') {
        list = list.filter((b) => b.status === statusFilter);
      }
    }

    if (!isCollaborator && !isAdmin) return list;

    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((b) => {
      const matchName =
        b.name?.toLowerCase().includes(term) ||
        b.clientName?.toLowerCase().includes(term);
      const matchPhone =
        b.phone?.includes(term) || b.clientPhone?.includes(term);
      const matchCode = b.apartmentCode?.toLowerCase().includes(term);
      const matchCtv = b.ctvName?.toLowerCase().includes(term);
      return Boolean(matchName || matchPhone || matchCode || matchCtv);
    });
  }, [
    bookings,
    searchTerm,
    isCollaborator,
    isAdmin,
    collectionFilter,
    statusFilter,
  ]);

  const openEdit = (booking: BookingRecord) => {
    setSelected(booking);
    setEditOpen(true);
  };

  const onSaved = (next: BookingRecord) => {
    setBookings((prev) =>
      prev
        .map((b) =>
          b.id === next.id && b._collection === next._collection ? next : b,
        )
        .sort((a, b) => {
          const ta =
            (a.updatedAt as { toMillis?: () => number })?.toMillis?.() ||
            (a.createdAt as { toMillis?: () => number })?.toMillis?.() ||
            0;
          const tb =
            (b.updatedAt as { toMillis?: () => number })?.toMillis?.() ||
            (b.createdAt as { toMillis?: () => number })?.toMillis?.() ||
            0;
          return tb - ta;
        }),
    );
  };

  const openContact = () => {
    void Linking.openURL(`${SITE_ORIGIN}`);
  };

  if (!authLoading && !user) {
    return (
      <View
        className="flex-1 items-center justify-center bg-white px-8"
        style={{ paddingTop: insets.top }}>
        <Text className="mb-2 text-center text-[22px] font-semibold leading-7 text-hoteliq-ink">
          Đăng nhập để xem lịch hẹn
        </Text>
        <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
          Lịch xem phòng và lịch dẫn khách của bạn sẽ hiển thị tại đây sau khi
          đăng nhập.
        </Text>
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}>
      <FlatList
        data={loading ? [] : filtered}
        keyExtractor={(item) => `${item._collection}-${item.id}`}
        renderItem={({ item }) => (
          <BookingCard
            booking={item}
            onEdit={openEdit}
            showSource={isAdmin}
          />
        )}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom:
            TAB_BAR_BODY_HEIGHT + insets.bottom + 16,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={Hoteliq.primary}
            colors={[Hoteliq.primary]}
          />
        }
        ListHeaderComponent={
          <View className="mb-6 gap-5 pt-3">
            <View className="min-w-0 gap-1.5">
              <Text className="text-[26px] font-semibold leading-[34px] text-hoteliq-ink">
                {title}
              </Text>
              <Text className="text-[14px] leading-5 text-hoteliq-gray">
                {isAdmin
                  ? 'Duyệt trạng thái, ghi chú BQT và theo dõi 3 nguồn đặt lịch.'
                  : 'Theo dõi trạng thái, lịch trình và phản hồi từ ban quản trị.'}
              </Text>
            </View>

            {isAdmin ? (
              <View className="flex-row gap-2">
                <FilterChip
                  label="Toàn hệ thống"
                  active={adminScope === 'all'}
                  onPress={() => setAdminScope('all')}
                />
                <FilterChip
                  label="Tôi tạo / gán"
                  active={adminScope === 'mine'}
                  onPress={() => setAdminScope('mine')}
                />
              </View>
            ) : null}

            {isCollaborator || isAdmin ? (
              <View className="min-h-[48px] flex-row items-center gap-2.5 rounded-full border border-hoteliq-line bg-white px-4">
                <Text className="text-base text-hoteliq-gray">⌕</Text>
                <TextInput
                  value={searchTerm}
                  onChangeText={setSearchTerm}
                  placeholder="Tìm khách, SĐT, mã căn…"
                  placeholderTextColor={Hoteliq.mutedLight}
                  className="min-w-0 flex-1 py-3 text-[15px] text-hoteliq-ink"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            ) : null}

            {isAdmin ? (
              <View className="gap-3">
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}>
                  {COLLECTION_FILTERS.map((f) => (
                    <FilterChip
                      key={f.key}
                      label={f.label}
                      active={collectionFilter === f.key}
                      onPress={() => setCollectionFilter(f.key)}
                    />
                  ))}
                </ScrollView>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}>
                  {STATUS_FILTERS.map((f) => (
                    <FilterChip
                      key={f.key}
                      label={f.label}
                      active={statusFilter === f.key}
                      onPress={() => setStatusFilter(f.key)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View>
              <BookingSkeleton />
              <BookingSkeleton />
              <BookingSkeleton />
            </View>
          ) : (
            <View className="items-center gap-3 rounded-[12px] bg-hoteliq-chip px-7 py-12">
              <Text className="text-center text-[16px] font-semibold leading-[22px] text-hoteliq-ink">
                {error ? 'Không tải được lịch hẹn' : 'Bạn chưa có lịch hẹn nào'}
              </Text>
              <Text className="text-center text-[14px] leading-5 text-hoteliq-gray">
                {error
                  ? error
                  : 'Đặt lịch từ trang chi tiết căn hộ để bắt đầu theo dõi tại đây.'}
              </Text>
              {error ? (
                <Pressable
                  onPress={() => void load('initial')}
                  hitSlop={8}
                  className="mt-1 min-h-11 items-center justify-center rounded-full bg-hoteliq-ink px-6"
                  style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}>
                  <Text className="text-sm font-semibold text-white">Thử lại</Text>
                </Pressable>
              ) : null}
            </View>
          )
        }
      />

      <Pressable
        onPress={openContact}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Liên hệ"
        className="absolute right-6 h-14 flex-row items-center justify-center gap-2 rounded-full bg-hoteliq-ink px-5"
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          bottom: TAB_BAR_BODY_HEIGHT + insets.bottom + 16,
          ...(HoteliqShadow as object),
        })}>
        <Text className="text-base text-white">💬</Text>
        <Text className="text-[13px] font-semibold text-white">Contact</Text>
      </Pressable>

      <BookingEditModal
        visible={editOpen}
        booking={selected}
        onClose={() => {
          setEditOpen(false);
          setSelected(null);
        }}
        onSaved={onSaved}
      />
    </View>
  );
}
