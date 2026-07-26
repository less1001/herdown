export type ParseResult = {
  title: string;
  markdown: string;
  images: string[];
};

const normalizeSpaces = (value: string) => value.replace(/[\t\r]+/g, ' ').replace(/\u00a0/g, ' ');

const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractTitle = (html: string, fallbackUrl: string) => {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch?.[1]) return normalizeSpaces(titleMatch[1]).trim();
  return fallbackUrl || 'Untitled';
};

const extractPictureArticleImages = (html: string): string[] => {
  const images: string[] = [];
  const listMatch = /picture_page_info_list\s*=\s*(\[[\s\S]*?\])\s*;/i.exec(html)
    || /picture_page_info_list\s*:\s*(\[[\s\S]*?\])\s*,/i.exec(html);

  if (!listMatch) return images;

  const listBlock = listMatch[1]
    .replace(/watermark_info\s*:\s*\{[\s\S]*?\}/gi, '')
    .replace(/share_cover\s*:\s*\{[\s\S]*?\}/gi, '');

  const cdnRegex = /cdn_url\s*:\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = cdnRegex.exec(listBlock)) !== null) {
    const cleanUrl = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
    if (cleanUrl.startsWith('http') && !images.includes(cleanUrl)) {
      images.push(cleanUrl);
    }
  }

  return images;
};

const extractWeChatContent = (html: string) => {
  const start = html.indexOf('<div id="js_content"');
  if (start >= 0) {
    const next = html.indexOf('<script', start);
    if (next > start) {
      return html.slice(start, next);
    }
  }

  const fallback = /content_noencode\s*:\s*(["'])([\s\S]*?)\1\s*,/i.exec(html);
  if (fallback?.[2]) {
    return decodeEntities(fallback[2].replace(/\\x3c/g, '<').replace(/\\x3e/g, '>'));
  }

  return html;
};

export function parseMarkdown(html: string, fallbackUrl = ''): ParseResult {
  const compact = normalizeSpaces(html);
  const title = extractTitle(compact, fallbackUrl);
  const contentHtml = extractWeChatContent(compact);
  const images = extractPictureArticleImages(contentHtml);

  const body = Array.from(contentHtml.matchAll(/<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi))
    .map((match) => match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const markdown = body.length > 0
    ? `${body}${images.length ? `\n\n${images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n')}` : ''}`
    : images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n');

  return { title, markdown, images };
}
