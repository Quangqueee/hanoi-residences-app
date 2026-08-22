import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/app';
import type { AiContent } from '@/lib/types';

export type GenerateListingSummaryInput = {
  title: string;
  roomType: string;
  district: string;
  address?: string;
  price: number;
  area?: number;
  detailedInformation?: string;
};

export type GenerateListingSummaryResult = {
  seoTitle: string;
  seoDescription: string;
  description: string;
  highlights: string[];
};

/**
 * Callable `generateListingSummary` — Groq chạy trên Cloud Functions,
 * không đưa API key vào app.
 */
export async function generateListingSummaryRemote(
  input: GenerateListingSummaryInput,
): Promise<GenerateListingSummaryResult> {
  try {
    const callable = httpsCallable<
      GenerateListingSummaryInput,
      GenerateListingSummaryResult
    >(functions, 'generateListingSummary');
    const result = await callable(input);
    const data = result.data;
    if (!data?.description && !data?.seoTitle) {
      throw new Error('AI không trả về nội dung hợp lệ.');
    }
    return {
      seoTitle: data.seoTitle || '',
      seoDescription: data.seoDescription || '',
      description: data.description || '',
      highlights: Array.isArray(data.highlights) ? data.highlights : [],
    };
  } catch (error) {
    console.error('generateListingSummaryRemote error:', error);
    const message =
      error instanceof Error ? error.message : 'Không tạo được mô tả AI.';
    if (
      message.includes('not-found') ||
      message.includes('NOT_FOUND') ||
      message.includes('unimplemented')
    ) {
      throw new Error(
        'Cloud Function generateListingSummary chưa được deploy. Deploy functions rồi thử lại.',
      );
    }
    throw new Error(message);
  }
}

export function toAiContent(
  result: GenerateListingSummaryResult,
): AiContent {
  return {
    seoTitle: result.seoTitle,
    seoDescription: result.seoDescription,
    description: result.description,
    highlights: result.highlights,
    updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
  };
}
