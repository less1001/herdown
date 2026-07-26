const normalizeSpaces = (value) => value.replace(/[\t\r]+/g, ' ').replace(/\u00a0/g, ' ');
const decodeEntities = (value) => value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const scanBlocks = (html, startToken, endToken) => {
    const blocks = [];
    let cursor = 0;
    while (cursor >= 0) {
        const start = html.indexOf(startToken, cursor);
        if (start < 0)
            break;
        const end = html.indexOf(endToken, start + startToken.length);
        if (end < 0)
            break;
        blocks.push(html.slice(start, end + endToken.length));
        cursor = end + endToken.length;
    }
    return blocks;
};
const extractTitle = (html, fallbackUrl) => {
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (titleMatch?.[1])
        return normalizeSpaces(titleMatch[1]).trim();
    return fallbackUrl || 'Untitled';
};
const extractPictureArticleImages = (html) => {
    const images = [];
    const listMatch = /picture_page_info_list\s*=\s*(\[[\s\S]*?\])\s*;/i.exec(html)
        || /picture_page_info_list\s*:\s*(\[[\s\S]*?\])\s*,/i.exec(html);
    if (!listMatch)
        return images;
    const listBlock = listMatch[1]
        .replace(/watermark_info\s*:\s*\{[\s\S]*?\}/gi, '')
        .replace(/share_cover\s*:\s*\{[\s\S]*?\}/gi, '');
    const cdnRegex = /cdn_url\s*:\s*["']([^"']+)["']/gi;
    let match;
    while ((match = cdnRegex.exec(listBlock)) !== null) {
        const cleanUrl = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
        if (cleanUrl.startsWith('http') && !images.includes(cleanUrl)) {
            images.push(cleanUrl);
        }
    }
    return images;
};
const extractWeChatContent = (html) => {
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
export function parseMarkdown(html, fallbackUrl = '') {
    const compact = normalizeSpaces(html);
    const title = extractTitle(compact, fallbackUrl);
    const contentHtml = extractWeChatContent(compact);
    const images = extractPictureArticleImages(contentHtml);
    const body = scanBlocks(contentHtml, '<p', '</p>')
        .concat(scanBlocks(contentHtml, '<h', '</h'))
        .map((block) => block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join('\n\n')
        .trim();
    const markdown = body.length > 0
        ? `${body}${images.length ? `\n\n${images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n')}` : ''}`
        : images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n');
    return { title, markdown, images };
}
