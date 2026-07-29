export type PlatformType = 'wechat' | 'xiaohongshu' | 'zhihu' | 'sspai' | 'twitter' | 'wikipedia' | 'general';

export type CrawlResult = {
  success: boolean;
  domain: string;
  total_pages: number;
  results: { url: string; title: string; markdown: string; elapsed_ms: number }[];
  elapsed_ms: number;
};

export type VectorChunk = {
  chunk_index: number;
  content: string;
  word_count: number;
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

export const detectPlatform = (url: string, html = ''): PlatformType => {
  if (url.includes('mp.weixin.qq.com')) return 'wechat';
  if (url.includes('xiaohongshu.com') || url.includes('xhslink.com') || url.includes('xhslink.cn')) return 'xiaohongshu';
  if (url.includes('zhihu.com')) return 'zhihu';
  if (url.includes('sspai.com')) return 'sspai';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('wikipedia.org')) return 'wikipedia';
  // Fallback: detect from HTML content signatures
  if (html) {
    if (html.includes('xhscdn.com') || html.includes('xiaohongshu') || html.includes('__INITIAL_STATE__') && html.includes('imageList')) return 'xiaohongshu';
    if (html.includes('mp.weixin.qq.com') || html.includes('js_content')) return 'wechat';
    if (html.includes('zhihu.com') || html.includes('Post-RichText')) return 'zhihu';
  }
  return 'general';
};

const extractTitle = (html: string, fallbackUrl: string): string => {
  const msgTitleMatch = /var\s+msg_title\s*=\s*["']([^"']+)["']/i.exec(html);
  if (msgTitleMatch?.[1] && msgTitleMatch[1].trim()) {
    return decodeEntities(normalizeSpaces(msgTitleMatch[1].trim()));
  }

  const h1Match = /<h1[^>]*activity-name[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  if (h1Match?.[1]) {
    const cleaned = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned) return decodeEntities(normalizeSpaces(cleaned));
  }

  const ogTitleMatch = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html);
  if (ogTitleMatch?.[1] && ogTitleMatch[1].trim()) {
    return decodeEntities(normalizeSpaces(ogTitleMatch[1].trim()));
  }

  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch?.[1]) {
    const cleaned = titleMatch[1].replace(/<[^>]+>/g, '').trim();
    if (cleaned && !cleaned.includes('微信公众号')) return decodeEntities(normalizeSpaces(cleaned));
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

  const startMatch = /<div[^>]*id=["']js_content["'][^>]*>/i.exec(html);
  if (startMatch) {
    const startPos = startMatch.index + startMatch[0].length;
    const endMarkers = [
      'class="rich_media_area_extra"',
      'id="js_to_share_div"',
      'id="js_content_bottom_area"',
      'id="js_bottom_ad_area"',
      'id="js_profile_qrcode"',
      'id="js_cmt_area"'
    ];

    let endPos = -1;
    for (const marker of endMarkers) {
      const p = html.indexOf(marker, startPos);
      if (p > startPos && (endPos === -1 || p < endPos)) {
        endPos = p;
      }
    }

    if (endPos > startPos) {
      const sub = html.lastIndexOf('<', endPos);
      if (sub > startPos) endPos = sub;
      bodyHtml = html.slice(startPos, endPos);
    } else {
      bodyHtml = html.slice(startPos);
    }

    bodyHtml = bodyHtml
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');
  }

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

// Xiaohongshu Note extraction — parses __INITIAL_STATE__ embedded JSON
const extractXiaohongshuBody = (html: string): { content: string; images: string[]; account?: string; author?: string; publish_date?: string } => {
  const images: string[] = [];

  // Decode \u002F and similar unicode escapes in a raw string
  const decodeUnicode = (s: string) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));

  // --- Extract images from imageList infoList ---
  // Pattern: "imageScene":"H5_DTL","url":"..."  — may be unicode-escaped (\u002F = /)
  const imgSceneRegex = /"imageScene"\s*:\s*"H5_DTL"\s*,\s*"url"\s*:\s*"([^"]+)"/g;
  let imgMatch: RegExpExecArray | null;
  while ((imgMatch = imgSceneRegex.exec(html)) !== null) {
    const url = decodeUnicode(imgMatch[1]).replace(/\\/g, '');
    if (url.startsWith('http') && !images.includes(url)) {
      images.push(url);
    }
  }

  // Fallback: match any xhscdn note image URL (not avatar, not static assets)
  if (images.length === 0) {
    // Stop at quotes, spaces, backslashes, commas, brackets, parens, semicolons
    const cdnRegex = /https?:\\?\/\\?\/sns-(?:webpic-qc|na-i\d+)\.xhscdn\.com\\?\/[^\s"'\\,\]\[)(;!]+(?:![^\s"'\\,\]\[)(;]+)?/g;
    let m: RegExpExecArray | null;
    while ((m = cdnRegex.exec(html)) !== null) {
      const url = decodeUnicode(m[0]).replace(/\\/g, '');
      if (!url.includes('avatar') && !images.includes(url)) {
        images.push(url);
      }
    }
  }

  // De-duplicate: remove low-res preview variants (nd_prv) when a matching full-quality (nd_dft) exists
  // Match by note file ID (after notes_pre_post/), not full URL, because CDN hash changes per request
  const deduped = images.filter(url => {
    if (url.includes('!nd_prv_')) {
      const noteIdMatch = /notes_pre_post\/([^!]+)/.exec(url);
      if (noteIdMatch) {
        const noteId = noteIdMatch[1];
        return !images.some(u => u.includes(`notes_pre_post/${noteId}`) && u.includes('!nd_dft_'));
      }
    }
    return true;
  });

  // --- Extract desc (note body text) ---
  let desc = '';
  const descMatches = [...html.matchAll(/"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (descMatches.length > 0) {
    // Pick the longest desc (most likely to be the actual note content)
    const longest = descMatches.reduce((a, b) => a[1].length >= b[1].length ? a : b);
    desc = decodeUnicode(longest[1])
      .replace(/\\n\\t/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, ' ')
      .replace(/\[买爆R\]/g, '🛍️')
      .replace(/\[赞R\]/g, '👍');
  }

  // Fallback to og:description meta tag
  if (!desc) {
    const metaMatch = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html) ||
      /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i.exec(html);
    if (metaMatch?.[1]) desc = decodeEntities(metaMatch[1]);
  }

  // --- Extract title ---
  let xhsTitle = '';
  const titleMatches = [...html.matchAll(/"title"\s*:\s*"([^"]{5,})"/g)];
  if (titleMatches.length > 0) {
    const best = titleMatches.find(m => !m[1].includes('\\') && m[1].length > 5);
    if (best) xhsTitle = decodeUnicode(best[1]);
  }

  // --- Extract author / nickname ---
  let author = '';
  let account = '';
  const nickMatches = [...html.matchAll(/"nickname"\s*:\s*"([^"]+)"/g)];
  if (nickMatches.length > 0) {
    // First non-system nickname is usually the note author
    author = decodeUnicode(nickMatches[0][1]);
    account = author;
  }

  // --- Build content string ---
  const content = desc;

  return { content, images: deduped, account, author };
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

  contentHtml = contentHtml.replace(/<span[^>]+data-tex=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/gi, (_, tex) => {
    return ` $${tex.trim()}$ `;
  });

  const imgRegex = /<img[^>]+(?:data-actualsrc|src)=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = match = imgRegex.exec(contentHtml)) !== null) {
    const url = match[1].replace(/&amp;/g, '&');
    if (url.startsWith('http') && !images.includes(url)) {
      images.push(url);
    }
  }

  return { content: contentHtml, images };
};

// Sspai article extraction — uses real HTML selectors from sspai.com page structure
const extractSspaiBody = (html: string): { content: string; images: string[]; author?: string; publish_date?: string } => {
  const images: string[] = [];

  // --- Author: class="ss__user__card__nickname" ---
  let author = '';
  const nickMatch = /class="ss__user__card__nickname"[^>]*>([^<]+)</.exec(html);
  if (nickMatch?.[1]) author = nickMatch[1].trim();

  // --- Date: class="article__header__date" e.g. "2026年07月28日" → "2026-07-28" ---
  let publish_date = '';
  const dateMatch = /class="article__header__date"[^>]*>\s*([\d年月日]+)\s*</.exec(html);
  if (dateMatch?.[1]) {
    publish_date = dateMatch[1].trim().replace(/(\d{4})年(\d{2})月(\d{2})日/, '$1-$2-$3');
  }

  // --- Article body: from first real content tag after "article-body" to "article__footer" ---
  const bodyStart = html.indexOf('class="article-body"');
  const footerStart = html.indexOf('class="article__footer', bodyStart > 0 ? bodyStart : 0);
  const articleRegion = bodyStart >= 0
    ? (footerStart > bodyStart ? html.slice(bodyStart, footerStart) : html.slice(bodyStart))
    : html;

  // Skip div wrapper attrs and benefits notice — jump to first real content tag
  const firstTag = articleRegion.search(/<(p|h[1-6]|blockquote|ul|ol)[^>]*>/i);
  let contentHtml = firstTag >= 0 ? articleRegion.slice(firstTag) : articleRegion;

  // Remove scripts, styles, noscripts
  contentHtml = contentHtml
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

  // Replace <figure class="ss-img-wrapper"> with plain <img>, prefer data-original (clean URL)
  contentHtml = contentHtml.replace(
    /<figure[^>]*class="[^"]*ss-img-wrapper[^"]*"[^>]*>[\s\S]*?<\/figure>/gi,
    (figHtml) => {
      const origMatch = /data-original="([^"]+)"/.exec(figHtml) || /src="([^"]+)"/.exec(figHtml);
      if (origMatch?.[1]) {
        const url = origMatch[1].replace(/&amp;/g, '&');
        if (url.startsWith('http') && !images.includes(url)) images.push(url);
        return `<img src="${url}" referrerpolicy="no-referrer" alt="图片" />`;
      }
      return '';
    }
  );

  return { content: contentHtml, images, author, publish_date };
};

// String-slicing Fast HTML-to-Markdown converter with Defuddle, Crawl4AI & Firecrawl standardization
const htmlToMarkdownFast = (html: string, platform: PlatformType, generateReferences = false): string => {
  let clean = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<div[^>]*id=["']js_pc_qr_code["'][\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class=["'][^"']*rich_media_tool[^"']*["'][\s\S]*?<\/div>/gi, '');

  // 1. Firecrawl Rule: Process <figure> with <figcaption> (Image Captions & Structured Alt)
  clean = clean.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_, figContent) => {
    const imgMatch = /<img[^>]+(?:data-src|data-original|data-actualsrc|src)=["']([^"']+)["'][^>]*>/i.exec(figContent);
    const captionMatch = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(figContent);
    
    if (imgMatch?.[1]) {
      const url = imgMatch[1].replace(/&amp;/g, '&');
      if (!url.startsWith('http') || url.includes('qrcode') || url.includes('avatar')) return '';
      const captionText = captionMatch?.[1] ? stripTags(captionMatch[1]).trim() : '';
      const altText = captionText || '图片';
      
      let out = `\n\n<img src="${url}" referrerpolicy="no-referrer" alt="${altText}" />\n\n`;
      if (captionText) {
        out += `\n*${captionText}*\n\n`;
      }
      return out;
    }
    return figContent;
  });

  // 2. Defuddle Rule: Process Callout / Alert elements
  clean = clean.replace(/<div[^>]*class=["'][^"']*markdown-alert-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
    const calloutType = type.toLowerCase() === 'warning' ? 'warning' : type.toLowerCase() === 'important' ? 'important' : 'note';
    const text = stripTags(body).split('\n').filter(l => l.trim()).join('\n> ');
    return `\n\n> [!${calloutType}]\n> ${text}\n\n`;
  });

  clean = clean.replace(/<div[^>]*data-callout=["']([^"']+)["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
    const text = stripTags(body).split('\n').filter(l => l.trim()).join('\n> ');
    return `\n\n> [!${type.toLowerCase()}]\n> ${text}\n\n`;
  });

  clean = clean.replace(/<div[^>]*class=["'][^"']*alert-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
    const calloutType = type.includes('danger') ? 'warning' : type.includes('success') ? 'tip' : 'info';
    const text = stripTags(body).split('\n').filter(l => l.trim()).join('\n> ');
    return `\n\n> [!${calloutType}]\n> ${text}\n\n`;
  });

  // 3. Standalone <img> tags with referrerpolicy="no-referrer"
  clean = clean.replace(/<img[^>]+(?:data-src|data-actualsrc|src)=["']([^"']+)["'][^>]*>/gi, (_, src) => {
    const url = src.replace(/&amp;/g, '&');
    if (!url.startsWith('http') || url.includes('qrcode') || url.includes('avatar')) return '';
    return `\n\n<img src="${url}" referrerpolicy="no-referrer" alt="图片" />\n\n`;
  });

  // 4. Crawl4AI Rule: Extract & Process Links (Inline vs References)
  const referencesList: string[] = [];
  if (generateReferences) {
    clean = clean.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, anchorText) => {
      const cleanHref = href.replace(/&amp;/g, '&');
      const text = stripTags(anchorText).trim();
      if (!cleanHref.startsWith('http') || !text) return text;
      
      let refIdx = referencesList.indexOf(cleanHref) + 1;
      if (refIdx === 0) {
        referencesList.push(cleanHref);
        refIdx = referencesList.length;
      }
      return `${text} [${refIdx}]`;
    });
  } else {
    clean = clean.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, anchorText) => {
      const cleanHref = href.replace(/&amp;/g, '&');
      const text = stripTags(anchorText).trim();
      if (!cleanHref.startsWith('http') || !text) return text;
      return `[${text}](${cleanHref})`;
    });
  }

  // 5. Headings Demotion (Defuddle rule: demote H1 to H2 to prevent duplicate main titles)
  clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `\n\n## ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `\n\n## ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `\n\n### ${stripTags(text)}\n\n`);
  clean = clean.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, (_, text) => `\n\n#### ${stripTags(text)}\n\n`);

  clean = clean.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, (_, text) => `**${stripTags(text)}**`);
  clean = clean.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, (_, text) => `*${stripTags(text)}*`);

  // 6. Codeblocks with language preservation & line number stripping
  clean = clean.replace(/<pre[^>]*><code[^>]*class=["'][^"']*language-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, lang, code) => {
    const cleanCode = code.replace(/<span[^>]*class=["'][^"']*line-number[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '');
    return `\n\n\`\`\`${lang}\n${decodeEntities(stripTags(cleanCode))}\n\`\`\`\n\n`;
  });
  clean = clean.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const cleanCode = code.replace(/<span[^>]*class=["'][^"']*line-number[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, '');
    return `\n\n\`\`\`\n${decodeEntities(stripTags(cleanCode))}\n\`\`\`\n\n`;
  });
  clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => ` \`${decodeEntities(stripTags(code))}\` `);

  clean = clean.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => `\n\n> ${stripTags(text).split('\n').join('\n> ')}\n\n`);

  clean = clean.replace(/<br\s*\/?>/gi, '\n');
  clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `\n\n${stripTags(text)}\n\n`);

  clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `\n- ${stripTags(text)}`);

  const noisyPhrases = ['预览时标签不可点', '微信扫一扫使用小程序', '知道了', '轻点两下取消赞', '轻点两下取消在看'];

  let result = clean
    .split('\n')
    .map(line => stripTags(normalizeSpaces(line)).trim())
    .filter(line => line && !noisyPhrases.some(phrase => line.includes(phrase)))
    .filter((line, idx, arr) => line || (idx > 0 && arr[idx - 1]))
    .join('\n')
    .trim();

  // Crawl4AI Rule: Append References Section if enabled
  if (generateReferences && referencesList.length > 0) {
    const refSection = `\n\n## References\n\n` + referencesList.map((url, i) => `[${i + 1}] ${url}`).join('\n');
    result += refSection;
  }

  return decodeEntities(result);
};

const stripTags = (html: string): string => {
  return html.replace(/<(?!img\b|br\b)[^>]+>/g, '').trim();
};

export type ParseResult = {
  success: boolean;
  title: string;
  markdown: string;
  frontmatter: string;
  images: string[];
  platform: PlatformType;
  account?: string;
  author?: string;
  publish_date?: string;
  elapsed_ms: number;
};

const extractMetadata = (html: string, platform: PlatformType): { account?: string; author?: string; publish_date?: string } => {
  let account: string | undefined;
  let author: string | undefined;
  let publish_date: string | undefined;

  if (platform === 'wechat') {
    const nickMatch = /var\s+nickname\s*=\s*["']([^"']+)["']/i.exec(html) ||
      /class=["'][^"']*rich_media_meta_nickname[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(html);
    if (nickMatch?.[1]) account = decodeEntities(stripTags(nickMatch[1])).trim();

    const authorMatch = /var\s+(?:author|msg_author)\s*=\s*["']([^"']+)["']/i.exec(html) ||
      /class=["'][^"']*rich_media_meta_text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
    if (authorMatch?.[1]) author = decodeEntities(stripTags(authorMatch[1])).trim();

    const ctMatch = /var\s+ct\s*=\s*["']?(\d{10})["']?/i.exec(html) ||
      /id=["']publish_time["'][^>]*>([\s\S]*?)<\/em>/i.exec(html);
    if (ctMatch?.[1]) {
      const val = ctMatch[1].trim();
      if (/^\d{10}$/.test(val)) {
        const d = new Date(parseInt(val, 10) * 1000);
        publish_date = d.toISOString().split('T')[0];
      } else {
        publish_date = decodeEntities(stripTags(val)).trim();
      }
    }
  } else {
    const authorMeta = /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i.exec(html);
    if (authorMeta?.[1]) author = decodeEntities(authorMeta[1]).trim();

    const dateMeta = /<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i.exec(html) ||
      /<meta\s+name=["']pubdate["']\s+content=["']([^"']+)["']/i.exec(html);
    if (dateMeta?.[1]) publish_date = dateMeta[1].split('T')[0];
  }

  return { account, author, publish_date };
};

export function parseMarkdown(html: string, targetUrl = ''): ParseResult {
  const startTime = Date.now();
  const platform = detectPlatform(targetUrl, html);
  const title = extractTitle(html, targetUrl);
  const meta = extractMetadata(html, platform);

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
    if (res.account) meta.account = res.account;
    if (res.author) meta.author = res.author;
  } else if (platform === 'zhihu') {
    const res = extractZhihuBody(html);
    extractedContent = res.content;
    images = res.images;
  } else if (platform === 'sspai') {
    const res = extractSspaiBody(html);
    extractedContent = res.content;
    images = res.images;
    if (res.author) meta.author = res.author;
    if (res.publish_date) meta.publish_date = res.publish_date;
  }

  let markdown = htmlToMarkdownFast(extractedContent, platform);

  // Defuddle Rule: Remove duplicate main title from start of body if it matches title
  if (markdown && title) {
    const lines = markdown.split('\n');
    const firstNonEmptyIdx = lines.findIndex(l => l.trim());
    if (firstNonEmptyIdx !== -1) {
      const firstLine = lines[firstNonEmptyIdx].trim().replace(/^#+\s*/, '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
      const cleanTitle = title.trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, '');
      if (firstLine && cleanTitle && (firstLine === cleanTitle || cleanTitle.includes(firstLine))) {
        lines.splice(firstNonEmptyIdx, 1);
        markdown = lines.join('\n').trim();
      }
    }
  }

  // If no images were inserted in-place, fallback to append
  if (images.length > 0 && !markdown.includes('<img')) {
    const imageMarkdown = images.map((url, idx) => {
      if (platform === 'wechat' || platform === 'xiaohongshu' || platform === 'sspai' || url.includes('qpic.cn') || url.includes('xhscdn.com') || url.includes('sspai.com')) {
        return `<img src="${url}" referrerpolicy="no-referrer" alt="图片 ${idx + 1}" />`;
      }
      return `![图片 ${idx + 1}](${url})`;
    }).join('\n\n');

    markdown = markdown ? `${markdown}\n\n${imageMarkdown}` : imageMarkdown;
  }

  if (!markdown.trim()) {
    markdown = `> 无可转换的纯文本内容。提取到的图片列表：\n\n` +
      images.map((url, idx) => `![图片 ${idx + 1}](${url})`).join('\n\n');
  }

  // Build Obsidian YAML Frontmatter
  const savedAt = new Date().toISOString();
  const yamlLines: string[] = ['---'];
  yamlLines.push(`source_url: "${targetUrl}"`);
  yamlLines.push(`title: "${title.replace(/"/g, '\\"')}"`); 
  if (meta.account) yamlLines.push(`account: "${meta.account.replace(/"/g, '\\"')}"`);
  if (meta.author) yamlLines.push(`author: "${meta.author.replace(/"/g, '\\"')}"`);
  if (meta.publish_date) yamlLines.push(`published_at: "${meta.publish_date}"`);
  yamlLines.push(`saved_at: "${savedAt}"`);
  yamlLines.push(`platform: ${platform}`);
  yamlLines.push(`parse_status: ok`);
  yamlLines.push('---');
  const frontmatter = yamlLines.join('\n');

  const elapsed_ms = Date.now() - startTime;

  return {
    success: true,
    title,
    markdown,
    frontmatter,
    images,
    platform,
    account: meta.account,
    author: meta.author,
    publish_date: meta.publish_date,
    elapsed_ms: Math.max(1, elapsed_ms),
  };
}

// Extract Sitemap URLs or internal page links from HTML/XML
export const extractSitemapUrls = (xmlOrHtml: string, baseUrl: string, limit = 10): string[] => {
  const urls: string[] = [];
  
  // 1. Try <loc> tags in XML Sitemap
  const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
  let match: RegExpExecArray | null;
  while ((match = locRegex.exec(xmlOrHtml)) !== null) {
    const url = match[1].trim();
    if (url.startsWith('http') && !urls.includes(url)) {
      urls.push(url);
      if (urls.length >= limit) return urls;
    }
  }

  // 2. Fallback to <a href="..."> internal links
  let domain = baseUrl;
  try {
    domain = new URL(baseUrl).origin;
  } catch {
    // ignore
  }

  const hrefRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
  while ((match = hrefRegex.exec(xmlOrHtml)) !== null) {
    let href = match[1].trim();
    if (href.startsWith('/')) {
      href = `${domain}${href}`;
    }
    if (href.startsWith(domain) && !urls.includes(href) && !href.includes('#')) {
      urls.push(href);
      if (urls.length >= limit) return urls;
    }
  }

  return urls.length > 0 ? urls : [baseUrl];
};

// Split Markdown into RAG Chunks
export const chunkMarkdownForRAG = (markdown: string, maxChunkSize = 500): VectorChunk[] => {
  const paragraphs = markdown.split(/\n\n+/);
  const chunks: VectorChunk[] = [];
  let currentChunk = '';
  let chunkIdx = 1;

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > maxChunkSize && currentChunk) {
      chunks.push({
        chunk_index: chunkIdx++,
        content: currentChunk.trim(),
        word_count: currentChunk.trim().split(/\s+/).length,
      });
      currentChunk = para;
    } else {
      currentChunk = currentChunk ? `${currentChunk}\n\n${para}` : para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push({
      chunk_index: chunkIdx,
      content: currentChunk.trim(),
      word_count: currentChunk.trim().split(/\s+/).length,
    });
  }

  return chunks;
};
