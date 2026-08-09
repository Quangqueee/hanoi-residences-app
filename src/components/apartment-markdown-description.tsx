import Markdown from 'react-native-markdown-display';
import { StyleSheet } from 'react-native';

type Props = {
  content: string | null | undefined;
};

/**
 * Renders AI SEO markdown with design-system-aligned styles.
 * Safe for null/undefined/empty content.
 */
export function ApartmentMarkdownDescription({ content }: Props) {
  const source =
    typeof content === 'string' && content.trim().length > 0
      ? content.trim()
      : 'Thông tin đang được cập nhật...';

  return <Markdown style={markdownStyles}>{source}</Markdown>;
}

const markdownStyles = StyleSheet.create({
  body: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
  },
  paragraph: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 0,
    marginBottom: 10,
  },
  heading1: {
    color: '#1A1A1A',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    color: '#1A1A1A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    color: '#1A1A1A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 4,
  },
  heading4: {
    color: '#1A1A1A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '700',
    color: '#1F2937',
  },
  em: {
    fontStyle: 'italic',
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  list_item: {
    color: '#374151',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: '#374151',
    marginTop: 8,
  },
  link: {
    color: '#1E75FF',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F3F4F6',
    borderLeftColor: '#D1D5DB',
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  code_inline: {
    backgroundColor: '#F3F4F6',
    color: '#1F2937',
    fontSize: 13,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  hr: {
    backgroundColor: '#E5E7EB',
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
