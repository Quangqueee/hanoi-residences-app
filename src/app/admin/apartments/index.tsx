import { Redirect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import { Hoteliq } from "@/constants/theme";
import { useAuth } from "@/contexts/auth-context";
import {
  countAdminApartments,
  deleteAdminApartment,
  fetchAdminApartmentsPage,
  pushApartment,
  pushApartmentsBatch,
  type AdminApartmentStatusFilter,
} from "@/lib/admin-apartments-service";
import { formatPriceAmount } from "@/lib/apartment-display";
import { getDisplaySourceCode } from "@/lib/source-code";
import type { Apartment, SubmissionStatus } from "@/lib/types";

const SEARCH_DEBOUNCE_MS = 350;

const STATUS_CHIPS: { value: AdminApartmentStatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ duyệt" },
  { value: "published", label: "Đã đăng" },
  { value: "rejected", label: "Từ chối" },
];

function isIndexBuildingError(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return (
    message.includes("FAILED_PRECONDITION") ||
    message.toLowerCase().includes("requires an index") ||
    message.toLowerCase().includes("needs an index")
  );
}

function dedupeApartments(items: Apartment[]): Apartment[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function formatPostedDate(createdAt: Apartment["createdAt"]): string {
  if (!createdAt?.seconds) return "—";
  return new Date(createdAt.seconds * 1000).toLocaleDateString("vi-VN");
}

function pendingOrRejectedLabel(
  status: SubmissionStatus | undefined,
): string | null {
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Từ chối";
  return null;
}

export default function AdminApartmentsScreen() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminApartmentStatusFilter>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const cursorRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    async (mode: "initial" | "refresh" | "more") => {
      const requestId = ++requestIdRef.current;
      if (mode === "initial") setLoading(true);
      if (mode === "refresh") setRefreshing(true);
      if (mode === "more") setLoadingMore(true);

      const filters = {
        status: statusFilter,
        searchQuery: debouncedSearch,
      };

      try {
        const cursor = mode === "more" ? cursorRef.current : null;
        const result = await fetchAdminApartmentsPage(filters, cursor);

        if (requestId !== requestIdRef.current) return;

        cursorRef.current = result.lastDoc;
        setHasMore(result.hasMore);
        setApartments((prev) =>
          mode === "more"
            ? dedupeApartments([...prev, ...result.apartments])
            : result.apartments,
        );

        if (mode !== "more") {
          try {
            const counted = await countAdminApartments(filters);
            if (requestId !== requestIdRef.current) return;
            setTotalCount(counted);
          } catch (countErr) {
            console.error(countErr);
            if (requestId !== requestIdRef.current) return;
            setTotalCount(null);
          }
        }
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        console.error(err);
        Alert.alert(
          "Lỗi",
          isIndexBuildingError(err)
            ? "Index tìm kiếm Firestore chưa sẵn sàng. Danh sách không ô tìm vẫn dùng được; search sẽ chạy sau khi index build xong (deploy firestore:indexes)."
            : "Không tải được danh sách căn hộ.",
        );
        if (mode !== "more") {
          setApartments([]);
          setHasMore(false);
          setTotalCount(null);
        }
      } finally {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, debouncedSearch],
  );

  useEffect(() => {
    if (authLoading || !isAdmin) return;
    cursorRef.current = null;
    setSelected(new Set());
    void load("initial");
  }, [authLoading, isAdmin, load]);

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
    Alert.alert("Đẩy tin", `Đẩy "${apt.title}" lên đầu?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đẩy",
        onPress: () => {
          void (async () => {
            setBusyId(apt.id);
            try {
              await pushApartment(apt.id);
              cursorRef.current = null;
              await load("refresh");
              Alert.alert("OK", "Đã đẩy tin.");
            } catch {
              Alert.alert("Lỗi", "Không đẩy được tin.");
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
      Alert.alert(
        "Chưa chọn",
        "Chọn ít nhất một tin (trên danh sách đã tải) để đẩy.",
      );
      return;
    }
    Alert.alert("Đẩy hàng loạt", `Đẩy ${ids.length} tin đã chọn?`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đẩy",
        onPress: () => {
          void (async () => {
            setBatchBusy(true);
            try {
              const n = await pushApartmentsBatch(ids);
              setSelected(new Set());
              cursorRef.current = null;
              await load("refresh");
              Alert.alert("OK", `Đã đẩy ${n} tin.`);
            } catch (err) {
              Alert.alert(
                "Lỗi",
                err instanceof Error ? err.message : "Đẩy hàng loạt thất bại.",
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
      "Xóa căn hộ",
      `Xóa "${apt.title}"? Có quota 10 lần/giờ. Ảnh Storage cũng bị xóa.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusyId(apt.id);
              try {
                await deleteAdminApartment(user.uid, apt.id);
                setApartments((prev) => prev.filter((x) => x.id !== apt.id));
                setTotalCount((prev) =>
                  prev == null ? prev : Math.max(0, prev - 1),
                );
                setSelected((prev) => {
                  const next = new Set(prev);
                  next.delete(apt.id);
                  return next;
                });
              } catch (err) {
                Alert.alert(
                  "Lỗi",
                  err instanceof Error ? err.message : "Xóa thất bại.",
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

  const countLabel = (() => {
    const loaded = apartments.length;
    if (totalCount != null) return `Đã tải ${loaded} / ${totalCount} căn`;
    return `Đã tải ${loaded} căn`;
  })();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top", "bottom"]}>
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
        data={loading ? [] : apartments}
        extraData={selected}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 120,
          flexGrow: 1,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              cursorRef.current = null;
              void load("refresh");
            }}
            tintColor={Hoteliq.primary}
          />
        }
        ListHeaderComponent={
          <View className="mb-4 gap-3">
            <View className="min-h-[48px] rounded-full border border-hoteliq-line px-4">
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm tiêu đề, mã nguồn, địa chỉ…"
                placeholderTextColor={Hoteliq.mutedLight}
                className="py-3 text-[15px] text-hoteliq-ink"
              />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_CHIPS.map((chip) => {
                const active = statusFilter === chip.value;
                return (
                  <Pressable
                    key={chip.value}
                    onPress={() => setStatusFilter(chip.value)}
                    className={`min-h-9 rounded-full border px-3 py-1.5 ${
                      active
                        ? "border-hoteliq-ink bg-hoteliq-ink"
                        : "border-hoteliq-line bg-white"
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-semibold ${
                        active ? "text-white" : "text-hoteliq-gray"
                      }`}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <View className="flex-row gap-2">
              <Pressable
                onPress={onPushBatch}
                disabled={batchBusy || selected.size === 0}
                className="min-h-10 flex-1 items-center justify-center rounded-full bg-hoteliq-ink px-3"
                style={{ opacity: selected.size === 0 ? 0.45 : 1 }}
              >
                {batchBusy ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text className="text-[12px] font-semibold text-white">
                    Đẩy đã chọn ({selected.size})
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={() => router.push("/admin/apartments/form")}
                className="min-h-10 flex-1 items-center justify-center rounded-full border border-hoteliq-line px-3"
              >
                <Text className="text-[12px] font-semibold text-hoteliq-ink">
                  + Thêm tin
                </Text>
              </Pressable>
            </View>
            <Text className="text-[13px] text-hoteliq-gray">{countLabel}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = busyId === item.id;
          const isSelected = selected.has(item.id);
          const thumb = item.imageUrls?.[0];
          const sourceCode =
            getDisplaySourceCode(item.sourceCode, "admin") || "—";
          const statusLabel = pendingOrRejectedLabel(item.submissionStatus);
          const wantsPush = Boolean(
            item.isPushRequested || item.pushRequestedAt,
          );
          return (
            <View className="mb-3 overflow-hidden rounded-[14px] border border-hoteliq-line">
              <View className="flex-row">
                <Pressable
                  onPress={() => toggleSelect(item.id)}
                  className="relative"
                >
                  {thumb ? (
                    <Image
                      source={{ uri: thumb }}
                      className="h-[108px] w-[108px] bg-hoteliq-chip"
                    />
                  ) : (
                    <View className="h-[108px] w-[108px] bg-hoteliq-chip" />
                  )}
                  <View
                    className={`absolute left-2 top-2 h-6 w-6 items-center justify-center rounded border ${
                      isSelected
                        ? "border-hoteliq-ink bg-hoteliq-ink"
                        : "border-white bg-white/90"
                    }`}
                  >
                    {isSelected ? (
                      <Text className="text-[12px] font-bold text-white">
                        ✓
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
                <View className="min-w-0 flex-1 justify-center px-3 py-2.5">
                  <Text
                    className="text-[15px] font-semibold text-hoteliq-ink"
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <Text className="mt-0.5 text-[15px] font-semibold text-hoteliq-ink">
                    {formatPriceAmount(item.price)}
                    <Text className="text-[12px] font-medium text-hoteliq-gray">
                      /tháng
                    </Text>
                  </Text>
                  <Text
                    className="mt-0.5 text-[12px] text-hoteliq-gray"
                    numberOfLines={1}
                  >
                    {item.commission}
                  </Text>
                  <Text
                    className="mt-0.5 text-[12px] text-hoteliq-gray"
                    numberOfLines={1}
                  >
                    {item.district || "—"}
                  </Text>
                  <Text
                    className="mt-0.5 text-[12px] text-hoteliq-gray"
                    numberOfLines={1}
                  >
                  {sourceCode}
                  </Text>
                  <Text className="mt-0.5 text-[12px] text-hoteliq-gray">
                    Cập nhật {formatPostedDate(item.createdAt)}
                  </Text>
                  {statusLabel || wantsPush ? (
                    <View className="mt-1 flex-row flex-wrap gap-x-2">
                      {statusLabel ? (
                        <Text
                          className={`text-[11px] font-semibold ${
                            item.submissionStatus === "rejected"
                              ? "text-red-700"
                              : "text-amber-700"
                          }`}
                        >
                          {statusLabel}
                        </Text>
                      ) : null}
                      {wantsPush ? (
                        <Text className="text-[11px] font-semibold text-amber-700">
                          Xin đẩy
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
              <View className="flex-row flex-wrap gap-2 border-t border-hoteliq-line px-3 py-2">
                <Action
                  label="Sửa"
                  onPress={() =>
                    router.push({
                      pathname: "/admin/apartments/form",
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
        ListFooterComponent={
          loading || apartments.length === 0 ? null : !hasMore ? (
            <Text className="py-5 text-center text-[13px] text-hoteliq-gray">
              Đã xem hết
            </Text>
          ) : (
            <Pressable
              onPress={() => {
                if (loading || refreshing || loadingMore || !hasMore) return;
                void load("more");
              }}
              disabled={loadingMore}
              className="mb-2 min-h-11 items-center justify-center rounded-full border border-hoteliq-line"
            >
              {loadingMore ? (
                <View className="flex-row items-center gap-2">
                  <ActivityIndicator size="small" color={Hoteliq.ink} />
                  <Text className="text-[13px] font-semibold text-hoteliq-ink">
                    Đang tải...
                  </Text>
                </View>
              ) : (
                <Text className="text-[13px] font-semibold text-hoteliq-ink">
                  Tải thêm
                </Text>
              )}
            </Pressable>
          )
        }
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
        destructive ? "border-red-200" : "border-hoteliq-line"
      }`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={Hoteliq.ink} />
      ) : (
        <Text
          className={`text-[12px] font-semibold ${
            destructive ? "text-red-700" : "text-hoteliq-ink"
          }`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
