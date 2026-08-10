import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getApartmentById } from '@/lib/apartments-service';
import {
  createBooking,
  fetchCollaborators,
  type AdminBookingMode,
  type CollaboratorOption,
} from '@/lib/bookings-service';
import type { Apartment } from '@/lib/types';

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  if (!value) return true;
  return /^\d{2}:\d{2}$/.test(value);
}

export default function NewBookingScreen() {
  const router = useRouter();
  const { apartmentId } = useLocalSearchParams<{ apartmentId?: string }>();
  const {
    user,
    userData,
    role,
    isAdmin,
    isCollaborator,
    roleLabel,
  } = useAuth();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [loadingApt, setLoadingApt] = useState(!!apartmentId);
  const [submitting, setSubmitting] = useState(false);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');

  // User fields
  const [name, setName] = useState(userData?.displayName || '');
  const [phone, setPhone] = useState(userData?.phoneNumber || '');

  // CTV / Admin client fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');

  // Admin assign CTV
  const [adminMode, setAdminMode] = useState<AdminBookingMode>('personal');
  const [ctvList, setCtvList] = useState<CollaboratorOption[]>([]);
  const [ctvSearch, setCtvSearch] = useState('');
  const [selectedCtv, setSelectedCtv] = useState<CollaboratorOption | null>(
    null,
  );
  const [loadingCtv, setLoadingCtv] = useState(false);

  useEffect(() => {
    setName(userData?.displayName || '');
    setPhone(userData?.phoneNumber || '');
  }, [userData?.displayName, userData?.phoneNumber]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!apartmentId) {
        setLoadingApt(false);
        return;
      }
      setLoadingApt(true);
      try {
        const data = await getApartmentById(apartmentId);
        if (active) setApartment(data);
      } finally {
        if (active) setLoadingApt(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [apartmentId]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const load = async () => {
      setLoadingCtv(true);
      try {
        const list = await fetchCollaborators();
        if (active) setCtvList(list);
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoadingCtv(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const filteredCtv = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase();
    if (!q) return ctvList;
    return ctvList.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q),
    );
  }, [ctvList, ctvSearch]);

  const screenTitle = isAdmin
    ? 'Thêm lịch cho căn này'
    : isCollaborator
      ? 'Đặt lịch dẫn khách'
      : 'Đặt lịch xem phòng';

  const onSubmit = async () => {
    if (!apartmentId) {
      Alert.alert('Thiếu căn hộ', 'Vui lòng mở đặt lịch từ trang chi tiết căn hộ.');
      return;
    }
    if (!role || role === 'landlord') {
      Alert.alert(
        'Không hỗ trợ',
        'Tài khoản hiện tại không thể tạo lịch hẹn từ app. Vui lòng dùng tài khoản User/CTV/Admin.',
      );
      return;
    }
    if (!isValidDate(bookingDate)) {
      Alert.alert('Ngày không hợp lệ', 'Nhập ngày theo định dạng YYYY-MM-DD.');
      return;
    }
    if (!isValidTime(bookingTime)) {
      Alert.alert('Giờ không hợp lệ', 'Nhập giờ theo định dạng HH:mm hoặc để trống.');
      return;
    }

    if (isCollaborator || (isAdmin && adminMode === 'assign_ctv')) {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert('Thiếu thông tin khách', 'Vui lòng nhập tên và SĐT khách.');
        return;
      }
    }

    if (isCollaborator && !consultationPrice.trim()) {
      Alert.alert('Thiếu giá tư vấn', 'CTV cần nhập giá tư vấn báo khách.');
      return;
    }

    if (!isCollaborator && !isAdmin) {
      if (!name.trim() || !phone.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên và số điện thoại.');
        return;
      }
    }

    if (isAdmin && adminMode === 'assign_ctv' && !selectedCtv) {
      Alert.alert('Chưa chọn CTV', 'Vui lòng chọn một CTV để gán lịch.');
      return;
    }

    if (isAdmin && adminMode === 'personal') {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert(
          'Thiếu thông tin',
          'Nhập tên và SĐT khách cho lịch cá nhân/private.',
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      await createBooking({
        role,
        apartmentId,
        apartmentCode: apartment?.sourceCode,
        apartmentTitle: apartment?.title,
        bookingDate,
        bookingTime: bookingTime || undefined,
        notes,
        budget,
        name,
        phone,
        userId: user?.uid,
        clientName,
        clientPhone,
        consultationPrice,
        ctvId: isAdmin
          ? selectedCtv?.uid
          : isCollaborator
            ? user?.uid
            : undefined,
        ctvName: isAdmin
          ? selectedCtv?.displayName
          : isCollaborator
            ? userData?.displayName || user?.displayName || 'Cộng tác viên'
            : undefined,
        ctvPhone: isAdmin
          ? selectedCtv?.phoneNumber
          : isCollaborator
            ? userData?.phoneNumber || ''
            : undefined,
        adminMode: isAdmin ? adminMode : undefined,
        createdByAdminId: isAdmin ? user?.uid : undefined,
      });

      Alert.alert('Thành công', 'Đã gửi yêu cầu đặt lịch.', [
        {
          text: 'OK',
          onPress: () => {
            if (router.canGoBack()) router.back();
            else router.replace('/(tabs)/bookings');
          },
        },
      ]);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tạo lịch. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingApt) {
    return (
      <ThemedView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.text} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['bottom']} style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
            <ThemedText type="subtitle">{screenTitle}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Vai trò: {roleLabel ?? '—'}
              {apartment?.sourceCode ? ` · Mã căn ${apartment.sourceCode}` : ''}
            </ThemedText>

            {isAdmin ? (
              <View style={styles.segment}>
                <Pressable
                  onPress={() => setAdminMode('personal')}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        adminMode === 'personal'
                          ? colors.text
                          : colors.backgroundElement,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{
                      color:
                        adminMode === 'personal'
                          ? colors.background
                          : colors.text,
                    }}>
                    Lịch cá nhân
                  </ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setAdminMode('assign_ctv')}
                  style={[
                    styles.segmentBtn,
                    {
                      backgroundColor:
                        adminMode === 'assign_ctv'
                          ? colors.text
                          : colors.backgroundElement,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{
                      color:
                        adminMode === 'assign_ctv'
                          ? colors.background
                          : colors.text,
                    }}>
                    Gán cho CTV
                  </ThemedText>
                </Pressable>
              </View>
            ) : null}

            {isAdmin && adminMode === 'assign_ctv' ? (
              <View style={styles.block}>
                <ThemedText type="smallBold">Chọn CTV *</ThemedText>
                <TextInput
                  placeholder="Tìm tên hoặc SĐT CTV"
                  placeholderTextColor={colors.textSecondary}
                  value={ctvSearch}
                  onChangeText={setCtvSearch}
                  style={[
                    styles.input,
                    {
                      color: colors.text,
                      backgroundColor: colors.backgroundElement,
                    },
                  ]}
                />
                {loadingCtv ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <View style={styles.ctvList}>
                    {filteredCtv.slice(0, 8).map((ctv) => {
                      const selected = selectedCtv?.uid === ctv.uid;
                      return (
                        <Pressable
                          key={ctv.uid}
                          onPress={() => setSelectedCtv(ctv)}
                          style={[
                            styles.ctvItem,
                            {
                              backgroundColor: selected
                                ? colors.backgroundSelected
                                : colors.backgroundElement,
                            },
                          ]}>
                          <ThemedText type="smallBold">
                            {ctv.displayName}
                          </ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {ctv.phoneNumber || 'Chưa có SĐT'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                    {filteredCtv.length === 0 ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        Không tìm thấy CTV.
                      </ThemedText>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            {isCollaborator || (isAdmin && adminMode === 'assign_ctv') ? (
              <>
                <Field
                  label="Tên khách *"
                  value={clientName}
                  onChangeText={setClientName}
                  colors={colors}
                />
                <Field
                  label="SĐT khách *"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  colors={colors}
                  keyboardType="phone-pad"
                />
                <Field
                  label={isCollaborator ? 'Giá tư vấn *' : 'Giá tư vấn'}
                  value={consultationPrice}
                  onChangeText={setConsultationPrice}
                  colors={colors}
                  placeholder="Giá báo khách..."
                />
                <Field
                  label="Nhu cầu / ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  colors={colors}
                  placeholder="VD: 8-10tr, có pet..."
                />
              </>
            ) : isAdmin && adminMode === 'personal' ? (
              <>
                <Field
                  label="Tên khách *"
                  value={clientName}
                  onChangeText={setClientName}
                  colors={colors}
                />
                <Field
                  label="SĐT khách *"
                  value={clientPhone}
                  onChangeText={setClientPhone}
                  colors={colors}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  colors={colors}
                  placeholder="VD: 5-7 triệu"
                />
              </>
            ) : (
              <>
                <Field
                  label="Họ và tên *"
                  value={name}
                  onChangeText={setName}
                  colors={colors}
                />
                <Field
                  label="Số điện thoại *"
                  value={phone}
                  onChangeText={setPhone}
                  colors={colors}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Ngân sách"
                  value={budget}
                  onChangeText={setBudget}
                  colors={colors}
                  placeholder="VD: 5-7 triệu"
                />
              </>
            )}

            <Field
              label="Ngày xem *"
              value={bookingDate}
              onChangeText={setBookingDate}
              colors={colors}
              placeholder="YYYY-MM-DD"
            />
            <Field
              label="Giờ xem (tuỳ chọn)"
              value={bookingTime}
              onChangeText={setBookingTime}
              colors={colors}
              placeholder="HH:mm"
            />
            <Field
              label="Ghi chú / nhu cầu cụ thể"
              value={notes}
              onChangeText={setNotes}
              colors={colors}
              placeholder={
                isCollaborator
                  ? 'Tài chính, xe điện, pet...'
                  : 'Yêu cầu đặc biệt (pet, chỗ để oto...)'
              }
              multiline
            />

            <Pressable
              onPress={onSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submit,
                {
                  backgroundColor: colors.text,
                  opacity: pressed || submitting ? 0.7 : 1,
                },
              ]}>
              {submitting ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <ThemedText
                  type="smallBold"
                  style={{ color: colors.background }}>
                  Xác nhận tạo lịch
                </ThemedText>
              )}
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  colors,
  placeholder,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  colors: {
    text: string;
    background: string;
    backgroundElement: string;
    backgroundSelected: string;
    textSecondary: string;
  };
  placeholder?: string;
  keyboardType?: 'default' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline ? styles.textarea : null,
          {
            color: colors.text,
            backgroundColor: colors.backgroundElement,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  segment: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { gap: Spacing.two },
  ctvList: { gap: Spacing.two },
  ctvItem: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: 2,
  },
  field: { gap: Spacing.one },
  input: {
    minHeight: 48,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  textarea: {
    minHeight: 96,
    paddingVertical: Spacing.three,
  },
  submit: {
    marginTop: Spacing.two,
    minHeight: 48,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
