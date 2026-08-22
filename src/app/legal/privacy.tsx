import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LegalPageShell } from '@/components/legal-page-shell';
import {
  LEGAL_UPDATED_AT,
  PRIVACY_SECTIONS,
  SITE_INFO,
} from '@/lib/legal-content';

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <LegalPageShell
      title="Chính sách bảo mật"
      subtitle={`Cập nhật lần gần nhất: ${LEGAL_UPDATED_AT}. Tài liệu giải thích cách ${SITE_INFO.name} xử lý dữ liệu cá nhân trên website và app.`}>
      <View className="gap-7">
        {PRIVACY_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text className="text-[17px] font-semibold text-hoteliq-ink">
              {section.title}
            </Text>
            <Text className="mt-2 text-[14px] leading-5 text-hoteliq-gray">
              {section.body}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-8 gap-3">
        <Pressable onPress={() => router.push('/legal/terms')}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Điều khoản dịch vụ
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/legal/faq')}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Câu hỏi thường gặp
          </Text>
        </Pressable>
      </View>
    </LegalPageShell>
  );
}
