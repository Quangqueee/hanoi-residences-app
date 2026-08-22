import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LegalPageShell } from '@/components/legal-page-shell';
import { LEGAL_UPDATED_AT, TERMS_SECTIONS } from '@/lib/legal-content';

export default function TermsScreen() {
  const router = useRouter();

  return (
    <LegalPageShell
      title="Điều khoản dịch vụ"
      subtitle={`Cập nhật lần gần nhất: ${LEGAL_UPDATED_AT}.`}>
      <View className="gap-7">
        {TERMS_SECTIONS.map((section) => (
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
        <Pressable onPress={() => router.push('/legal/privacy')}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Chính sách bảo mật
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
