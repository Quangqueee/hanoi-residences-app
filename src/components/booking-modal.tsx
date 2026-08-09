import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/contexts/auth-context';
import {
  createBooking,
  fetchCollaborators,
  type AdminBookingMode,
  type CollaboratorOption,
} from '@/lib/bookings-service';
import type { Apartment } from '@/lib/types';

type Props = {
  visible: boolean;
  apartment: Apartment;
  onClose: () => void;
};

const UI = {
  primary: '#1E75FF',
  ink: '#1A1A1A',
  muted: '#7A7A7A',
  border: '#E5E7EB',
  soft: '#F3F5F9',
  danger: '#DC2626',
  inputBg: '#FFFFFF',
} as const;

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string): boolean {
  if (!value) return true;
  return /^\d{2}:\d{2}$/.test(value);
}

export function BookingModal({ visible, apartment, onClose }: Props) {
  const {
    user,
    userData,
    role,
    isAdmin,
    isCollaborator,
    roleLabel,
  } = useAuth();

  const [submitting, setSubmitting] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');

  const [name, setName] = useState(userData?.displayName || '');
  const [phone, setPhone] = useState(userData?.phoneNumber || '');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [consultationPrice, setConsultationPrice] = useState('');

  const [adminMode, setAdminMode] = useState<AdminBookingMode>('personal');
  const [ctvList, setCtvList] = useState<CollaboratorOption[]>([]);
  const [ctvSearch, setCtvSearch] = useState('');
  const [selectedCtv, setSelectedCtv] = useState<CollaboratorOption | null>(
    null,
  );
  const [loadingCtv, setLoadingCtv] = useState(false);

  const isLeadForm = isCollaborator || isAdmin;

  const title = isAdmin
    ? 'Thêm lịch cho căn này'
    : isCollaborator
      ? 'Đặt lịch dẫn khách'
      : 'Đặt lịch xem phòng';

  useEffect(() => {
    if (!visible) return;
    setName(userData?.displayName || '');
    setPhone(userData?.phoneNumber || '');
  }, [visible, userData?.displayName, userData?.phoneNumber]);

  useEffect(() => {
    if (!visible || !isAdmin) return;
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
  }, [visible, isAdmin]);

  const filteredCtv = useMemo(() => {
    const q = ctvSearch.trim().toLowerCase();
    if (!q) return ctvList;
    return ctvList.filter(
      (c) =>
        c.displayName.toLowerCase().includes(q) ||
        c.phoneNumber.includes(q),
    );
  }, [ctvList, ctvSearch]);

  const resetForm = () => {
    setBookingDate('');
    setBookingTime('');
    setNotes('');
    setBudget('');
    setClientName('');
    setClientPhone('');
    setConsultationPrice('');
    setAdminMode('personal');
    setCtvSearch('');
    setSelectedCtv(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const onSubmit = async () => {
    if (!role || role === 'landlord') {
      Alert.alert(
        'Không hỗ trợ',
        'Tài khoản hiện tại không thể tạo lịch hẹn từ app.',
      );
      return;
    }
    if (!isValidDate(bookingDate)) {
      Alert.alert('Ngày không hợp lệ', 'Nhập ngày theo định dạng YYYY-MM-DD.');
      return;
    }
    if (!isValidTime(bookingTime)) {
      Alert.alert(
        'Giờ không hợp lệ',
        'Nhập giờ theo định dạng HH:mm hoặc để trống.',
      );
      return;
    }

    if (isCollaborator || isAdmin) {
      if (!clientName.trim() || !clientPhone.trim()) {
        Alert.alert('Thiếu thông tin khách', 'Vui lòng nhập tên và SĐT khách.');
        return;
      }
      if (!consultationPrice.trim() && (isCollaborator || adminMode === 'assign_ctv')) {
        Alert.alert('Thiếu giá tư vấn', 'Vui lòng nhập giá tư vấn báo khách.');
        return;
      }
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

    setSubmitting(true);
    try {
      await createBooking({
        role,
        apartmentId: apartment.id,
        apartmentCode: apartment.sourceCode,
        apartmentTitle: apartment.title,
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
            resetForm();
            onClose();
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSub}>
                {roleLabel ?? '—'}
                {apartment.sourceCode ? ` · Mã ${apartment.sourceCode}` : ''}
              </Text>
            </View>
            <Pressable
              onPress={handleClose}
              hitSlop={10}
              style={({ pressed }) => [
                styles.closeBtn,
                pressed && { opacity: 0.7 },
              ]}>
              <Text style={styles.closeBtnText}>Đóng</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isAdmin ? (
              <View style={styles.segment}>
                <Pressable
                  onPress={() => setAdminMode('personal')}
                  style={[
                    styles.segmentBtn,
                    adminMode === 'personal' && styles.segmentBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.segmentText,
                      adminMode === 'personal' && styles.segmentTextActive,
                    ]}>
                    Khách cá nhân
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setAdminMode('assign_ctv')}
                  style={[
                    styles.segmentBtn,
                    adminMode === 'assign_ctv' && styles.segmentBtnActive,
                  ]}>
                  <Text
                    style={[
                      styles.segmentText,
                      adminMode === 'assign_ctv' && styles.segmentTextActive,
                    ]}>
                    Khách CTV
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {isAdmin && adminMode === 'assign_ctv' ? (
              <View style={styles.block}>
                <Text style={styles.label}>Chọn CTV *</Text>
                <TextInput
                  placeholder="Tìm tên hoặc SĐT CTV"
                  placeholderTextColor={UI.muted}
                  value={ctvSearch}
                  onChangeText={setCtvSearch}
                  style={styles.input}
                />
                {loadingCtv ? (
                  <ActivityIndicator color={UI.primary} />
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
                            selected && styles.ctvItemSelected,
                          ]}>
                          <Text style={styles.ctvName}>{ctv.displayName}</Text>
                          <Text style={styles.ctvPhone}>
                            {ctv.phoneNumber || 'Chưa có SĐT'}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {filteredCtv.length === 0 ? (
                      <Text style={styles.hint}>Không tìm thấy CTV.</Text>
                    ) : null}
                  </View>
                )}
              </View>
            ) : null}

            {isLeadForm ? (
              <>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <Text style={styles.label}>
                      Tên khách <Text style={styles.req}>*</Text>
                    </Text>
                    <TextInput
                      value={clientName}
                      onChangeText={setClientName}
                      placeholder="Họ tên khách"
                      placeholderTextColor={UI.muted}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.half}>
                    <Text style={styles.label}>
                      SĐT khách <Text style={styles.req}>*</Text>
                    </Text>
                    <TextInput
                      value={clientPhone}
                      onChangeText={setClientPhone}
                      placeholder="Số điện thoại"
                      placeholderTextColor={UI.muted}
                      keyboardType="phone-pad"
                      style={styles.input}
                    />
                  </View>
                </View>

                <View style={styles.block}>
                  <Text style={styles.label}>
                    Giá tư vấn{' '}
                    {isCollaborator || adminMode === 'assign_ctv' ? (
                      <Text style={styles.req}>*</Text>
                    ) : null}
                  </Text>
                  <TextInput
                    value={consultationPrice}
                    onChangeText={setConsultationPrice}
                    placeholder="Giá báo khách..."
                    placeholderTextColor={UI.muted}
                    style={styles.input}
                  />
                </View>

                <View style={styles.block}>
                  <Text style={styles.label}>Ngân sách</Text>
                  <TextInput
                    value={budget}
                    onChangeText={setBudget}
                    placeholder="VD: 5-7tr"
                    placeholderTextColor={UI.muted}
                    style={styles.input}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.block}>
                  <Text style={styles.label}>
                    Họ và tên <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    placeholder="Họ tên"
                    placeholderTextColor={UI.muted}
                    style={styles.input}
                  />
                </View>
                <View style={styles.block}>
                  <Text style={styles.label}>
                    Số điện thoại <Text style={styles.req}>*</Text>
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="SĐT"
                    placeholderTextColor={UI.muted}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>
                <View style={styles.block}>
                  <Text style={styles.label}>Ngân sách</Text>
                  <TextInput
                    value={budget}
                    onChangeText={setBudget}
                    placeholder="VD: 5-7 triệu"
                    placeholderTextColor={UI.muted}
                    style={styles.input}
                  />
                </View>
              </>
            )}

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>
                  {isCollaborator || isAdmin ? 'Ngày dẫn' : 'Ngày xem'}{' '}
                  <Text style={styles.req}>*</Text>
                </Text>
                <TextInput
                  value={bookingDate}
                  onChangeText={setBookingDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={UI.muted}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Giờ (tuỳ chọn)</Text>
                <TextInput
                  value={bookingTime}
                  onChangeText={setBookingTime}
                  placeholder="HH:mm"
                  placeholderTextColor={UI.muted}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.block}>
              <Text style={styles.label}>Lưu ý thêm</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={
                  isCollaborator || isAdmin
                    ? 'Tài chính, xe điện, pet...'
                    : 'Yêu cầu đặc biệt (pet, chỗ để ô tô...)'
                }
                placeholderTextColor={UI.muted}
                style={[styles.input, styles.textArea]}
                multiline
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => void onSubmit()}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                (pressed || submitting) && { opacity: 0.85 },
              ]}>
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitText}>Xác nhận tạo lịch</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: UI.border,
    gap: 12,
  },
  headerTextWrap: { flex: 1, gap: 4 },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: UI.ink,
  },
  headerSub: {
    fontSize: 13,
    color: UI.muted,
    fontWeight: '500',
  },
  closeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: UI.soft,
  },
  closeBtnText: {
    color: UI.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 14,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: UI.soft,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
      default: {},
    }),
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: UI.muted,
  },
  segmentTextActive: {
    color: UI.ink,
  },
  block: { gap: 6 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: { flex: 1, gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: UI.ink,
  },
  req: { color: UI.danger },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: UI.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: UI.ink,
    backgroundColor: UI.inputBg,
  },
  textArea: {
    minHeight: 96,
    paddingTop: 12,
  },
  ctvList: { gap: 8, marginTop: 4 },
  ctvItem: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: UI.soft,
    gap: 2,
  },
  ctvItemSelected: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: UI.primary,
  },
  ctvName: {
    fontSize: 14,
    fontWeight: '700',
    color: UI.ink,
  },
  ctvPhone: {
    fontSize: 12,
    color: UI.muted,
  },
  hint: {
    fontSize: 13,
    color: UI.muted,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: UI.border,
  },
  submitBtn: {
    minHeight: 52,
    borderRadius: 16,
    backgroundColor: UI.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
