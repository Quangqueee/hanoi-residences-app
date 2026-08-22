import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import OpenAI from 'openai';

initializeApp();

const groqApiKey = defineSecret('GROQ_API_KEY');

type Input = {
  title: string;
  roomType: string;
  district: string;
  address?: string;
  price: number;
  area?: number;
  detailedInformation?: string;
};

type Output = {
  seoTitle: string;
  seoDescription: string;
  description: string;
  highlights: string[];
};

/**
 * Callable: generateListingSummary
 * App: httpsCallable('generateListingSummary')
 * Secret: GROQ_API_KEY (Firebase secrets / env)
 */
export const generateListingSummary = onCall(
  {
    region: 'asia-southeast1',
    secrets: [groqApiKey],
  },
  async (request): Promise<Output> => {
    if (!request.auth?.uid) {
      throw new HttpsError('unauthenticated', 'Cần đăng nhập.');
    }

    const uid = request.auth.uid;
    const userSnap = await getFirestore().collection('users').doc(uid).get();
    const role = userSnap.data()?.role;
    if (role !== 'admin' && role !== 'landlord') {
      throw new HttpsError(
        'permission-denied',
        'Chỉ admin hoặc chủ nhà được gọi AI.',
      );
    }

    const data = request.data as Input;
    if (!data?.title || !data?.district || data.price == null) {
      throw new HttpsError('invalid-argument', 'Thiếu title/district/price.');
    }

    const apiKey = groqApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Chưa cấu hình GROQ_API_KEY.');
    }

    const formattedPrice =
      data.price > 0
        ? `${(data.price * 1_000_000).toLocaleString('de-DE')} VNĐ/tháng`
        : 'Thỏa thuận';
    const formattedArea =
      data.area && data.area > 0 ? `${data.area} m2` : 'Không cung cấp';

    const systemPrompt = `Bạn là chuyên gia Content SEO BĐS Hà Nội. Trả JSON:
{"seoTitle":"...","seoDescription":"...","description":"markdown","highlights":["..."]}`;

    const userPrompt = `Tiêu đề: ${data.title}
Loại: ${data.roomType}
Quận: ${data.district}
Địa chỉ: ${data.address || ''}
Giá: ${formattedPrice}
Diện tích: ${formattedArea}
Chi tiết:
${data.detailedInformation || ''}`;

    const groq = new OpenAI({
      apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content || '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new HttpsError('internal', 'AI trả về JSON không hợp lệ.');
    }

    return {
      seoTitle: String(parsed.seoTitle || ''),
      seoDescription: String(parsed.seoDescription || ''),
      description: String(parsed.description || '').trim(),
      highlights: Array.isArray(parsed.highlights)
        ? parsed.highlights.map(String)
        : [],
    };
  },
);
