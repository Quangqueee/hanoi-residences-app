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

/** Palette Airbnb-style: ink #0A0A0A, body #5D5F61, hairline #D8DCE0, chip #F7F7F7 */
const markdownStyles = StyleSheet.create({
  body: {
    color: '#5D5F61',
    fontSize: 15,
    lineHeight: 24,
  },
  paragraph: {
    color: '#5D5F61',
    fontSize: 15,
    lineHeight: 24,
    marginTop: 0,
    marginBottom: 10,
  },
  heading1: {
    color: '#0A0A0A',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  heading2: {
    color: '#0A0A0A',
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    color: '#0A0A0A',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 4,
  },
  heading4: {
    color: '#0A0A0A',
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  strong: {
    fontWeight: '600',
    color: '#0A0A0A',
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
    color: '#5D5F61',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 4,
  },
  bullet_list_icon: {
    color: '#5D5F61',
    marginTop: 8,
  },
  link: {
    color: '#0A0A0A',
    textDecorationLine: 'underline',
  },
  blockquote: {
    backgroundColor: '#F7F7F7',
    borderLeftColor: '#D8DCE0',
    borderLeftWidth: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  code_inline: {
    backgroundColor: '#F7F7F7',
    color: '#0A0A0A',
    fontSize: 13,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: '#F7F7F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  hr: {
    backgroundColor: '#D8DCE0',
    height: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
});
