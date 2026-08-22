import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { LegalPageShell } from '@/components/legal-page-shell';
import { FAQ_ITEMS, LEGAL_UPDATED_AT } from '@/lib/legal-content';

export default function FaqScreen() {
  const router = useRouter();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <LegalPageShell
      title="Câu hỏi thường gặp"
      subtitle={`Cập nhật: ${LEGAL_UPDATED_AT}`}>
      <View className="gap-2">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index;
          return (
            <View
              key={item.question}
              className="overflow-hidden rounded-[12px] border border-hoteliq-line">
              <Pressable
                onPress={() => setOpenIndex(open ? null : index)}
                className="flex-row items-start justify-between gap-3 px-4 py-3.5"
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                <Text className="min-w-0 flex-1 text-[15px] font-semibold leading-5 text-hoteliq-ink">
                  {item.question}
                </Text>
                <Text className="text-[16px] text-hoteliq-gray">
                  {open ? '−' : '+'}
                </Text>
              </Pressable>
              {open ? (
                <View className="border-t border-hoteliq-line px-4 py-3">
                  <Text className="text-[14px] leading-5 text-hoteliq-gray">
                    {item.answer}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>

      <View className="mt-8 gap-3">
        <Pressable onPress={() => router.push('/legal/privacy')}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Chính sách bảo mật
          </Text>
        </Pressable>
        <Pressable onPress={() => router.push('/legal/terms')}>
          <Text className="text-[14px] font-semibold text-hoteliq-ink underline">
            Điều khoản dịch vụ
          </Text>
        </Pressable>
      </View>
    </LegalPageShell>
  );
}
