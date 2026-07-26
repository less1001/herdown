export type PlatformType = 'wechat' | 'xiaohongshu' | 'zhihu' | 'twitter' | 'wikipedia' | 'general';

export type ParseResult = {
  success: boolean;
  title: string;
  markdown: string;
  images: string[];
  platform: PlatformType;
  elapsed_ms: number;
};

const normalizeSpaces = (value: string): string =>
  value.replace(/[\t\r]+/g, ' ').replace(/\u00a0/g, ' ');

const decodeEntities = (value: string): string =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/gi, '/');

export const detectPlatform = (url: string): PlatformType => {
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('xiaohongshu.com') || url.includes('xhslink.com')) return 'xiaohongshu';
  if (url.includes('zhihu.com')) return 'zhihu';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('wikipedia.org')) return 'wikipedia';
  return 'general';
};

const extractTitle = (html: string, fallbackUrl: string): string => {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html) ||
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html) ||
    /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);

  if (titleMatch?.[1]) {
    const cleaned = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned) return decodeEntities(normalizeSpaces(cleaned));
  }
  return fallbackUrl || 'Untitled Page';
};

// WeChat Photo Gallery (picture_page_info_list) image extraction with deduplication
const extractWeChatPhotoGalleryImages = (html: string): string[] => {
  const images: string[] = [];
  const listMatch =
    /picture_page_info_list\s*=\s*(\[[\s\S]*?\])\s*;/i.exec(html) ||
    /picture_page_info_list\s*:\s*(\[[\s\S]*?\])\s*,/i.exec(html);

  if (!listMatch) return images;

  // PRD 5.2: Strip watermark_info & share_cover sub-objects first to prevent duplication
  const cleanListBlock = listMatch[1]
    .replace(/watermark_info\s*:\s*\{[\s\S]*?\}/gi, '')
    .replace(/share_cover\s*:\s*\{[\s\S]*?\}/gi, '');

  const cdnRegex = /cdn_url\s*:\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = cdnRegex.exec(cleanListBlock)) !== null) {
    const cleanUrl = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
    if (cleanUrl.startsWith('http') && !images.includes(cleanUrl)) {
      images.push(cleanUrl);
    }
  }

  return images;
};

// Extract WeChat main content body
const extractWeChatBody = (html: string): { content: string; images: string[] } => {
  let bodyHtml = '';
  const galleryImages = extractWeChatPhotoGalleryImages(html);

  // 1. Try js_content element
  const startIdx = html.indexOf('id="js_content"');
  if (startIdx >= 0) {
    const contentStart = html.indexOf('>', startIdx) + 1;
    const contentEnd = html.indexOf('id="js_to_share_div"', contentStart);
    if (contentEnd > contentStart) {
      bodyHtml = html.slice(contentStart, contentEnd);
    } else {
      const scriptEnd = html.indexOf('<script', contentStart);
      bodyHtml = scriptEnd > contentStart ? html.slice(contentStart, scriptEnd) : html.slice(contentStart);
    }
  }

  // 2. Fallback to content_noencode JS variable
  if (!bodyHtml || bodyHtml.trim().length < 50) {
    const fallback = /content_noencode\s*:\s*(["'])([\s\S]*?)\1\s*,/i.exec(html);
    if (fallback?.[2]) {
      bodyHtml = fallback[2]
        .replace(/\\x3c/gi, '<')
        .replace(/\\x3e/gi, '>')
        .replace(/\\x22/gi, '"')
        .replace(/\\x27/gi, "'")
        .replace(/\\/g, '');
    }
  }

  // Collect image URLs from data-src or src
  const allImages: string[] = [...galleryImages];
  const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgRegex.exec(bodyHtml || html)) !== null) {
    const imgUrl = imgMatch[1].replace(/&amp;/g, '&');
    if (imgUrl.startsWith('http') && !allImages.includes(imgUrl) && !imgUrl.includes('qrcode')) {
      allImages.push(imgUrl);
    }
  }

  return { content: bodyHtml || html, images: allImages };
};

// Xiaohongshu Note extraction
const extractXiaohongshuBody = (html: string): { content: string; images: string[] } => {
  const images: string[] = [];

  // Extract meta tags or state JSON for Xiaohongshu
  const descMatch = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html) ||
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i.exec(html);
  
  const contentStr = descMatch?.[1] ? decodeEntities(descMatch[1]) : '';

  // Extract Xiaohongshu CDN images
  const cdnRegex = /(https?:\/\/[^"'\s]+\.xhscdn\.com\/[^"'\s]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = cdnRegex.exec(html)) !== null) {
    const url = match[1];
    if (!images.includes(url) && !url.includes('avatar')) {
      images.push(url);
    }
  }

  return { content: contentStr, images };
};

// Zhihu Column/Answer extraction with LaTeX preservation
const extractZhihuBody = (html: string): { content: string; images: string[] } => {
  const images: string[] = [];
  let contentHtml = '';

  const postMatch = /class=["'][^"']*Post-RichText[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html) ||
    /class=["'][^"']*RichText[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
  
  if (postMatch?.[1]) {
    contentHtml = postMatch[1];
  } else {
    contentHtml = html;
  }

  // Preserve LaTeX formulas encoded in data-tex attributes
  contentHtml = contentHtml.replace(/<span[^>]+data-tex=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/gi, (_, tex) => {
    return ` $${tex.trim()}$ `;
  });

  // Extract images
  const imgRegex = /<img[^>]+(?:data-actualsrc|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(contentHtml)) !== null) {
    const url = match[1].replace(/&amp;/g, '&');
    if (url.startsWith('http') && !images.includes(url)) {
      images.push(url);
    }
  }

  return { content: contentHtml, images };
};

// String-slicing Fast HTML-to-Markdown converter
const htmlToMarkdownFast = (html: string, platform: PlatformType): string => {
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div[^>]*id=["']js_pc_qr_code["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*rich_media_tool[^"']*["'][\s\S]*?<\/div>/gi, '');

  // Convert Headings
  clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n\n# ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n\n## ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n\n### ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n\n#### ${stripTags(text)}\n\n`);

  // Convert Bold & Italic
  clean = clean.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, (_, text) => `**${stripTags(text)}**`);
  clean = clean.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, (_, text) => `*${stripTags(text)}*`);

  // Convert Code blocks
  clean = clean.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => `\n\n\`\`\`\n${decodeEntities(stripTags(code))}\n\`\`\`\n\n`);
  clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => ` \`${decodeEntities(stripTags(code))}\` `);

  // Convert Blockquotes
  clean = clean.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => `\n\n> ${stripTags(text).split('\n').join('\n> ')}\n\n`);

  // Convert Paragraphs & Line Breaks
  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n\n${stripTags(text)}\n\n`);

  // Convert List Items
  clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${stripTags(text)}`);

  // Final cleanup of extra whitespace and tabs
  const result = clean
    .split('\n')
    .map(line => normalizeSpaces(line).trim())
    .filter((line, idx, arr) => line || (idx > 0 && arr[idx - 1]))
    .join('\n')
    .trim();

  return decodeEntities(result);
};

const stripTags = (html: string): string => {
  return html.replace(/<[^>]+>/g, '').trim();
};

export function parseMarkdown(html: string, targetUrl = ''): ParseResult {
  const startTime = Date.now();
  const platform = detectPlatform(targetUrl);
  const title = extractTitle(html, targetUrl);

  let extractedContent = html;
  let images: string[] = [];

  if (platform === 'wechat') {
    const res = extractWeChatBody(html);
    extractedContent = res.content;
    images = res.images;
  } else if (platform === 'xiaohongshu') {
    const res = extractXiaohongshuBody(html);
    extractedContent = res.content;
    images = res.images;
  } else if (platform === 'zhihu') {
    const res = extractZhihuBody(html);
    extractedContent = res.content;
    images = res.images;
  }

  let markdown = htmlToMarkdownFast(extractedContent, platform);

  // Fallback: If markdown body is sparse but images exist, append Markdown images
  if (images.length > 0) {
    const imageMarkdown = images.map((url, idx) => `![图片 ${idx + 1}](${url})`).join('\n\n');
    if (!markdown.includes('![')) {
      markdown = markdown ? `${markdown}\n\n${imageMarkdown}` : imageMarkdown;
    }
  }

  if (!markdown.trim()) {
    markdown = `> 无可转换的纯文本内容。提取到的图片列表：\n\n` +
      images.map((url, idx) => `![图片 ${idx + 1}](${url})`).join('\n\n');
  }

  const elapsed_ms = Date.now() - startTime;

  return {
    success: true,
    title,
    markdown,
    images,
    platform,
    elapsed_ms: Math.max(1, elapsed_ms),
  };
}
