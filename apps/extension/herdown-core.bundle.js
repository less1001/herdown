"use strict";
var HerdownCore = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../core/src/index.ts
  var index_exports = {};
  __export(index_exports, {
    chunkMarkdownForRAG: () => chunkMarkdownForRAG,
    detectPlatform: () => detectPlatform,
    extractSitemapUrls: () => extractSitemapUrls,
    parseMarkdown: () => parseMarkdown
  });

  // ../core/src/parser.ts
  var normalizeSpaces = (value) => value.replace(/[\t\r]+/g, " ").replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").replace(/\u200b/g, "").replace(/\ufeff/g, "").replace(/\ufffd/g, "");
  var decodeEntities = (value) => value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x2F;/gi, "/").replace(/&nbsp;/gi, " ");
  var detectPlatform = (url, html = "") => {
    if (url.includes("mp.weixin.qq.com")) return "wechat";
    if (url.includes("xiaohongshu.com") || url.includes("xhslink.com") || url.includes("xhslink.cn")) return "xiaohongshu";
    if (url.includes("zhihu.com")) return "zhihu";
    if (url.includes("sspai.com")) return "sspai";
    if (url.includes("36kr.com")) return "kr36";
    if (url.includes("twitter.com") || url.includes("x.com")) return "twitter";
    if (url.includes("wikipedia.org")) return "wikipedia";
    if (html) {
      if (html.includes("xhscdn.com") || html.includes("xiaohongshu") || html.includes("__INITIAL_STATE__") && html.includes("imageList")) return "xiaohongshu";
      if (html.includes("mp.weixin.qq.com") || html.includes("js_content")) return "wechat";
      if (html.includes("zhihu.com") || html.includes("Post-RichText")) return "zhihu";
      if (html.includes("36kr.com") || html.includes("articleDetailContent")) return "kr36";
    }
    return "general";
  };
  var extractTitle = (html, fallbackUrl) => {
    const msgTitleMatch = /var\s+msg_title\s*=\s*["']([^"']+)["']/i.exec(html);
    if (msgTitleMatch?.[1] && msgTitleMatch[1].trim()) {
      return decodeEntities(normalizeSpaces(msgTitleMatch[1].trim()));
    }
    const h1Match = /<h1[^>]*QuestionHeader-title[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || /<h1[^>]*Post-Title[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || /<h1[^>]*activity-name[^>]*>([\s\S]*?)<\/h1>/i.exec(html) || /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
    if (h1Match?.[1]) {
      const cleaned = h1Match[1].replace(/<[^>]+>/g, "").replace(/- 知乎$/, "").trim();
      if (cleaned) return decodeEntities(normalizeSpaces(cleaned));
    }
    const ogTitleMatch = /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i.exec(html);
    if (ogTitleMatch?.[1] && ogTitleMatch[1].trim()) {
      return decodeEntities(normalizeSpaces(ogTitleMatch[1].trim().replace(/- 知乎$/, "")));
    }
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
    if (titleMatch?.[1]) {
      const cleaned = titleMatch[1].replace(/<[^>]+>/g, "").replace(/- 知乎$/, "").trim();
      if (cleaned && !cleaned.includes("\u5FAE\u4FE1\u516C\u4F17\u53F7")) return decodeEntities(normalizeSpaces(cleaned));
    }
    return fallbackUrl || "Untitled Page";
  };
  var extractEmbeddedJsonContent = (html) => {
    const candidates = [
      /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html)?.[1],
      /<script[^>]+id=["']__NUXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i.exec(html)?.[1],
      /(?:window\.)?(?:__INITIAL_STATE__|__NUXT__|__APOLLO_STATE__)\s*=\s*([\s\S]*?)(?:;\s*<\/script>|<\/script>)/i.exec(html)?.[1]
    ].filter((value) => Boolean(value));
    let state;
    for (const candidate of candidates) {
      try {
        state = JSON.parse(candidate.trim().replace(/;\s*$/, ""));
        break;
      } catch {
      }
    }
    if (!state) return null;
    const contentCandidates = [];
    const titleCandidates = [];
    const images = /* @__PURE__ */ new Set();
    const contentKeys = /^(content|body|html|articlebody|article_content|正文|text|description)$/i;
    const titleKeys = /^(title|headline|name|article_title|page_title)$/i;
    const imageKeys = /(?:image|images|thumbnail|cover|src|url)/i;
    const walk = (value, key = "", depth = 0) => {
      if (depth > 12 || value === null || value === void 0) return;
      if (typeof value === "string") {
        const text = value.replace(/\\u002F/gi, "/").replace(/\\\//g, "/").trim();
        if (titleKeys.test(key) && text.length > 2 && text.length < 300) titleCandidates.push(text);
        if (contentKeys.test(key) && text.length >= 20) {
          const htmlScore = /<\/?(?:p|article|section|div|h[1-6]|img|br)[\s>]/i.test(text) ? 3 : 1;
          contentCandidates.push({ value: text, score: text.length * htmlScore });
        }
        if (imageKeys.test(key)) {
          (text.match(/https?:\/\/[^\s"'<>]+/g) || []).forEach((url) => images.add(url.replace(/[),;]+$/, "")));
        }
        return;
      }
      if (Array.isArray(value)) {
        value.slice(0, 200).forEach((item) => walk(item, key, depth + 1));
        return;
      }
      if (typeof value === "object") {
        Object.entries(value).slice(0, 300).forEach(([childKey, childValue]) => walk(childValue, childKey, depth + 1));
      }
    };
    walk(state);
    const best = contentCandidates.sort((a, b) => b.score - a.score)[0];
    if (!best) return null;
    const content = /<\/?[a-z][\s>]/i.test(best.value) ? best.value : `<p>${best.value}</p>`;
    return { content, title: titleCandidates[0], images: Array.from(images).slice(0, 100) };
  };
  var extractWeChatPhotoGalleryImages = (html) => {
    const images = [];
    const listMatch = /picture_page_info_list\s*=\s*(\[[\s\S]*?\])\s*;/i.exec(html) || /picture_page_info_list\s*:\s*(\[[\s\S]*?\])\s*,/i.exec(html);
    if (!listMatch) return images;
    const cleanListBlock = listMatch[1].replace(/watermark_info\s*:\s*\{[\s\S]*?\}/gi, "").replace(/share_cover\s*:\s*\{[\s\S]*?\}/gi, "");
    const cdnRegex = /cdn_url\s*:\s*["']([^"']+)["']/gi;
    let match;
    while ((match = cdnRegex.exec(cleanListBlock)) !== null) {
      const cleanUrl = match[1].replace(/\\/g, "").replace(/&amp;/g, "&");
      if (cleanUrl.startsWith("http") && !images.includes(cleanUrl)) {
        images.push(cleanUrl);
      }
    }
    return images;
  };
  var extractWeChatBody = (html) => {
    let bodyHtml = "";
    const galleryImages = extractWeChatPhotoGalleryImages(html);
    const startMatch = /<div[^>]*id=["']js_content["'][^>]*>/i.exec(html);
    if (startMatch) {
      const startPos = startMatch.index + startMatch[0].length;
      const endMarkers = [
        'class="rich_media_area_extra"',
        'class="reward_area"',
        'class="qr_code_pc"',
        'id="js_to_share_div"',
        'id="js_content_bottom_area"',
        'id="js_bottom_ad_area"',
        'id="js_profile_qrcode"',
        'id="js_cmt_area"',
        "\u8D5E\u8D4F",
        "Like the Author"
      ];
      let endPos = -1;
      for (const marker of endMarkers) {
        const p = html.indexOf(marker, startPos);
        if (p > startPos && (endPos === -1 || p < endPos)) {
          endPos = p;
        }
      }
      if (endPos > startPos) {
        const sub = html.lastIndexOf("<", endPos);
        if (sub > startPos) endPos = sub;
        bodyHtml = html.slice(startPos, endPos);
      } else {
        bodyHtml = html.slice(startPos);
      }
      bodyHtml = bodyHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
    }
    if (!bodyHtml || bodyHtml.trim().length < 50) {
      const fallback = /content_noencode\s*:\s*(["'])([\s\S]*?)\1\s*,/i.exec(html);
      if (fallback?.[2]) {
        bodyHtml = fallback[2].replace(/\\x3c/gi, "<").replace(/\\x3e/gi, ">").replace(/\\x22/gi, '"').replace(/\\x27/gi, "'").replace(/\\/g, "");
      }
    }
    const allImages = [...galleryImages];
    const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(bodyHtml || html)) !== null) {
      const imgUrl = imgMatch[1].replace(/&amp;/g, "&");
      if (imgUrl.startsWith("http") && !allImages.includes(imgUrl) && !imgUrl.includes("qrcode")) {
        allImages.push(imgUrl);
      }
    }
    return { content: bodyHtml || html, images: allImages };
  };
  var extractXiaohongshuBody = (html) => {
    const images = [];
    const decodeUnicode = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
    const imgSceneRegex = /"imageScene"\s*:\s*"H5_DTL"\s*,\s*"url"\s*:\s*"([^"]+)"/g;
    let imgMatch;
    while ((imgMatch = imgSceneRegex.exec(html)) !== null) {
      const url = decodeUnicode(imgMatch[1]).replace(/\\/g, "");
      if (url.startsWith("http") && !images.includes(url)) {
        images.push(url);
      }
    }
    if (images.length === 0) {
      const cdnRegex = /https?:\\?\/\\?\/sns-(?:webpic-qc|na-i\d+)\.xhscdn\.com\\?\/[^\s"'\\,\]\[)(;!]+(?:![^\s"'\\,\]\[)(;]+)?/g;
      let m;
      while ((m = cdnRegex.exec(html)) !== null) {
        const url = decodeUnicode(m[0]).replace(/\\/g, "");
        if (!url.includes("avatar") && !images.includes(url)) {
          images.push(url);
        }
      }
    }
    const deduped = images.filter((url) => {
      if (url.includes("!nd_prv_")) {
        const noteIdMatch = /notes_pre_post\/([^!]+)/.exec(url);
        if (noteIdMatch) {
          const noteId = noteIdMatch[1];
          return !images.some((u) => u.includes(`notes_pre_post/${noteId}`) && u.includes("!nd_dft_"));
        }
      }
      return true;
    });
    let desc = "";
    const descMatches = [...html.matchAll(/"desc"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
    if (descMatches.length > 0) {
      const longest = descMatches.reduce((a, b) => a[1].length >= b[1].length ? a : b);
      desc = decodeUnicode(longest[1]).replace(/\\n\\t/g, "\n").replace(/\\n/g, "\n").replace(/\\t/g, " ").replace(/\[买爆R\]/g, "\u{1F6CD}\uFE0F").replace(/\[赞R\]/g, "\u{1F44D}");
    }
    if (!desc) {
      const metaMatch = /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i.exec(html) || /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i.exec(html);
      if (metaMatch?.[1]) desc = decodeEntities(metaMatch[1]);
    }
    let xhsTitle = "";
    const titleMatches = [...html.matchAll(/"title"\s*:\s*"([^"]{5,})"/g)];
    if (titleMatches.length > 0) {
      const best = titleMatches.find((m) => !m[1].includes("\\") && m[1].length > 5);
      if (best) xhsTitle = decodeUnicode(best[1]);
    }
    let author = "";
    let account = "";
    const nickMatches = [...html.matchAll(/"nickname"\s*:\s*"([^"]+)"/g)];
    if (nickMatches.length > 0) {
      author = decodeUnicode(nickMatches[0][1]);
      account = author;
    }
    const content = desc;
    return { content, images: deduped, account, author };
  };
  var extractZhihuBody = (html) => {
    const images = [];
    let contentHtml = "";
    let author = "";
    const authorMatch = /class=["'][^"']*AuthorInfo-name[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html) || /class=["'][^"']*AuthorInfo-name[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html) || /class=["'][^"']*UserLink-link[^"']*["'][^>]*>([^<]+)</i.exec(html) || /"author":\s*\{\s*"name":\s*"([^"]+)"/i.exec(html);
    if (authorMatch?.[1]) {
      author = stripTags(authorMatch[1]).trim();
    }
    const postMatch = /class=["'][^"']*Post-RichText[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html) || /class=["'][^"']*RichText[^"']*["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
    if (postMatch?.[1]) {
      contentHtml = postMatch[1];
    } else {
      contentHtml = html;
    }
    contentHtml = contentHtml.replace(/<a[^>]+href=["'][^"']*zhida\.zhihu\.com[^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, (_, text) => {
      return stripTags(text);
    });
    contentHtml = contentHtml.replace(/<span[^>]+data-tex=["']([^"']+)["'][^>]*>[\s\S]*?<\/span>/gi, (_, tex) => {
      return ` $${tex.trim()}$ `;
    });
    const imgRegex = /<img[^>]+(?:data-actualsrc|src)=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(contentHtml)) !== null) {
      const url = match[1].replace(/&amp;/g, "&");
      if (url.startsWith("http") && !images.includes(url)) {
        images.push(url);
      }
    }
    return { content: contentHtml, images, author };
  };
  var extractSspaiBody = (html) => {
    const images = [];
    let author = "";
    const nickMatch = /class="ss__user__card__nickname"[^>]*>([^<]+)</.exec(html);
    if (nickMatch?.[1]) author = nickMatch[1].trim();
    let publish_date = "";
    const dateMatch = /class="article__header__date"[^>]*>\s*([\d年月日]+)\s*</.exec(html);
    if (dateMatch?.[1]) {
      publish_date = dateMatch[1].trim().replace(/(\d{4})年(\d{2})月(\d{2})日/, "$1-$2-$3");
    }
    const bodyStart = html.indexOf('class="article-body"');
    const footerStart = html.indexOf('class="article__footer', bodyStart > 0 ? bodyStart : 0);
    const articleRegion = bodyStart >= 0 ? footerStart > bodyStart ? html.slice(bodyStart, footerStart) : html.slice(bodyStart) : html;
    const firstTag = articleRegion.search(/<(p|h[1-6]|blockquote|ul|ol)[^>]*>/i);
    let contentHtml = firstTag >= 0 ? articleRegion.slice(firstTag) : articleRegion;
    contentHtml = contentHtml.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<noscript[\s\S]*?<\/noscript>/gi, "");
    contentHtml = contentHtml.replace(
      /<figure[^>]*class="[^"]*ss-img-wrapper[^"]*"[^>]*>[\s\S]*?<\/figure>/gi,
      (figHtml) => {
        const origMatch = /data-original="([^"]+)"/.exec(figHtml) || /src="([^"]+)"/.exec(figHtml);
        if (origMatch?.[1]) {
          const url = origMatch[1].replace(/&amp;/g, "&");
          if (url.startsWith("http") && !images.includes(url)) images.push(url);
          return `<img src="${url}" referrerpolicy="no-referrer" alt="\u56FE\u7247" />`;
        }
        return "";
      }
    );
    return { content: contentHtml, images, author, publish_date };
  };
  var extract36KrBody = (html) => {
    const images = [];
    let author = "";
    const authorMatch = /"author":"([^"]+)"/.exec(html) || /"userNick":"([^"]+)"/.exec(html);
    if (authorMatch?.[1]) author = decodeEntities(authorMatch[1]).trim();
    let publish_date = "";
    const timeMatch = /"publishTime":(\d+)/.exec(html) || /"firstPublishTime":(\d+)/.exec(html);
    if (timeMatch?.[1]) {
      const d = new Date(parseInt(timeMatch[1], 10));
      publish_date = d.toISOString().split("T")[0];
    }
    let contentHtml = "";
    const contentStart = html.indexOf("articleDetailContent");
    if (contentStart >= 0) {
      const startTag = html.indexOf(">", contentStart);
      let endTag = html.indexOf("\u8BE5\u6587\u89C2\u70B9\u4EC5\u4EE3\u8868\u4F5C\u8005\u672C\u4EBA", startTag > 0 ? startTag : 0);
      if (endTag < 0) endTag = html.indexOf('class="article-footer"', startTag > 0 ? startTag : 0);
      if (endTag < 0) endTag = html.indexOf('class="common-content-footer"', startTag > 0 ? startTag : 0);
      if (endTag < 0) endTag = html.indexOf("\u9700\u8981\u4F60\u7684\u9F13\u52B1", startTag > 0 ? startTag : 0);
      contentHtml = startTag >= 0 ? endTag > startTag ? html.slice(startTag + 1, endTag) : html.slice(startTag + 1) : html;
    } else {
      contentHtml = html;
    }
    const imgRegex = /<img[^>]+(?:data-src|src)=["']([^"']+)["']/gi;
    let match;
    while ((match = imgRegex.exec(contentHtml)) !== null) {
      const url = match[1].replace(/&amp;/g, "&");
      if (url.startsWith("http") && !images.includes(url)) {
        images.push(url);
      }
    }
    return { content: contentHtml, images, author, publish_date };
  };
  var htmlToMarkdownFast = (html, platform, generateReferences = false) => {
    let clean = html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<div[^>]*id=["']js_pc_qr_code["'][\s\S]*?<\/div>/gi, "").replace(/<div[^>]*class=["'][^"']*rich_media_tool[^"']*["'][\s\S]*?<\/div>/gi, "");
    clean = clean.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, (_, figContent) => {
      const imgMatch = /<img[^>]+(?:data-src|data-original|data-actualsrc|src)=["']([^"']+)["'][^>]*>/i.exec(figContent);
      const captionMatch = /<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i.exec(figContent);
      if (imgMatch?.[1]) {
        const url = imgMatch[1].replace(/&amp;/g, "&");
        if (!url.startsWith("http") || url.includes("qrcode") || url.includes("avatar")) return "";
        const captionText = captionMatch?.[1] ? stripTags(captionMatch[1]).trim() : "";
        const altText = captionText || "\u56FE\u7247";
        let out = `

![${altText}](${url})

`;
        if (captionText) {
          out += `
*${captionText}*

`;
        }
        return out;
      }
      return figContent;
    });
    clean = clean.replace(/<div[^>]*class=["'][^"']*markdown-alert-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
      const calloutType = type.toLowerCase() === "warning" ? "warning" : type.toLowerCase() === "important" ? "important" : "note";
      const text = toQuotedLines(body);
      return "\n\n> [!" + calloutType + "]\n" + (text ? text + "\n" : "") + "\n";
    });
    clean = clean.replace(/<div[^>]*data-callout=["']([^"']+)["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
      const text = toQuotedLines(body);
      return "\n\n> [!" + type.toLowerCase() + "]\n" + (text ? text + "\n" : "") + "\n";
    });
    clean = clean.replace(/<div[^>]*class=["'][^"']*alert-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi, (_, type, body) => {
      const calloutType = type.includes("danger") ? "warning" : type.includes("success") ? "tip" : "info";
      const text = toQuotedLines(body);
      return "\n\n> [!" + calloutType + "]\n" + (text ? text + "\n" : "") + "\n";
    });
    clean = clean.replace(/<img[^>]+(?:data-src|data-actualsrc|src)=["']([^"']+)["'][^>]*>/gi, (_, src) => {
      const url = src.replace(/&amp;/g, "&");
      if (!url.startsWith("http") || url.includes("qrcode") || url.includes("avatar")) return "";
      return `

![\u56FE\u7247](${url})

`;
    });
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `

${text}

`);
    clean = clean.replace(/<br\s*\/?>/gi, "\n");
    clean = clean.replace(/<(?:nav|header|footer|aside|script|style|form|iframe)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|script|style|form|iframe)>/gi, "");
    clean = clean.replace(/Close\s*1?人喜欢[\s\S]*?赞赏/gi, "").replace(/Like the Author[\s\S]*?赞赏/gi, "").replace(/赞赏后展示我的头像[\s\S]*?100%/gi, "").replace(/Close\s*更多[\s\S]*?100%/gi, "");
    clean = clean.replace(/<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi, (_, summary, body) => {
      const title = stripTags(summary).trim() || "Details";
      const content = toQuotedLines(body);
      return "\n\n> [!note]- " + title + "\n" + (content ? content + "\n" : "") + "\n";
    });
    clean = clean.replace(/<input[^>]+type=["']checkbox["'][^>]*>/gi, (tag) => {
      return /checked/i.test(tag) ? "- [x] " : "- [ ] ";
    });
    clean = clean.replace(/<(?:del|s|strike)[^>]*>([\s\S]*?)<\/(?:del|s|strike)>/gi, (_, text) => `~~${stripTags(text).trim()}~~`);
    clean = clean.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (_, text) => `^${stripTags(text).trim()}^`);
    clean = clean.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (_, text) => `~${stripTags(text).trim()}~`);
    clean = clean.replace(/<video[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/video>/gi, (_, src) => `

![Video](${src})

`);
    clean = clean.replace(/<audio[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<\/audio>/gi, (_, src) => `

> \u{1F3B5} [Audio Track](${src})

`);
    const referencesList = [];
    if (generateReferences) {
      clean = clean.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, anchorText) => {
        const cleanHref = href.replace(/&amp;/g, "&");
        const text = stripTags(anchorText).trim();
        if (!cleanHref.startsWith("http") || !text) return text;
        let refIdx = referencesList.indexOf(cleanHref) + 1;
        if (refIdx === 0) {
          referencesList.push(cleanHref);
          refIdx = referencesList.length;
        }
        return `${text} [${refIdx}]`;
      });
    } else {
      clean = clean.replace(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, anchorText) => {
        const cleanHref = href.replace(/&amp;/g, "&");
        const text = stripTags(anchorText).trim();
        if (!cleanHref.startsWith("http") || !text) return text;
        return `[${text}](${cleanHref})`;
      });
    }
    clean = clean.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, (_, text) => `

## ${stripTags(text)}

`);
    clean = clean.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, (_, text) => `

### ${stripTags(text)}

`);
    clean = clean.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, (_, text) => `

#### ${stripTags(text)}

`);
    clean = clean.replace(/<(?:b|strong)[^>]*>([\s\S]*?)<\/(?:b|strong)>/gi, (_, text) => {
      let t = stripTags(text).trim();
      if (!t) return "";
      let prefix = "";
      let suffix = "";
      const leadQuote = t.match(/^[’'”"“‘]+/);
      if (leadQuote) {
        prefix = leadQuote[0];
        t = t.slice(prefix.length);
      }
      const tailQuote = t.match(/[’'”"“‘]+$/);
      if (tailQuote) {
        suffix = tailQuote[0];
        t = t.slice(0, t.length - suffix.length);
      }
      t = t.trim();
      if (!t) return `${prefix}${suffix}`;
      return `${prefix}**${t}**${suffix}`;
    });
    clean = clean.replace(/<(?:i|em)[^>]*>([\s\S]*?)<\/(?:i|em)>/gi, (_, text) => {
      const t = stripTags(text).trim();
      return t ? `*${t}*` : "";
    });
    const convertHtmlTableToMarkdown = (tableHtml) => {
      const rows = [];
      let rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      if (rowMatches && rowMatches.length > 0) {
        for (const rHtml of rowMatches) {
          const cells = [];
          const cellMatches = rHtml.match(/<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi) || [];
          for (const cHtml of cellMatches) {
            const cellText = stripTags(cHtml).replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
            cells.push(cellText);
          }
          if (cells.length > 0) rows.push(cells);
        }
      } else {
        const divRowMatches = tableHtml.match(/<(?:div|section|p)[^>]*class=["'][^"']*(?:row|tr|table_row|grid)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section|p)>/gi) || tableHtml.match(/<(?:div|section)[^>]*style=["'][^"']*flex[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|section)>/gi);
        if (divRowMatches) {
          for (const rHtml of divRowMatches) {
            const cells = [];
            const cellMatches = rHtml.match(/<(?:div|section|span|p|td|th)[^>]*>([\s\S]*?)<\/(?:div|section|span|p|td|th)>/gi) || [];
            for (const cHtml of cellMatches) {
              const cellText = stripTags(cHtml).replace(/\s+/g, " ").replace(/\|/g, "\\|").trim();
              if (cellText) cells.push(cellText);
            }
            if (cells.length > 0) rows.push(cells);
          }
        }
      }
      if (rows.length === 0) return "";
      const maxCols = Math.max(...rows.map((r) => r.length));
      if (maxCols === 0) return "";
      const headerRow = `| ${rows[0].concat(Array(maxCols - rows[0].length).fill("")).join(" | ")} |`;
      const delimiterRow = `| ${Array(maxCols).fill("---").join(" | ")} |`;
      const bodyRows = rows.slice(1).map((r) => {
        const padded = r.concat(Array(maxCols - r.length).fill(""));
        return `| ${padded.join(" | ")} |`;
      });
      return `

${headerRow}
${delimiterRow}
${bodyRows.join("\n")}

`;
    };
    clean = clean.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (_, tableHtml) => convertHtmlTableToMarkdown(tableHtml));
    clean = clean.replace(/<section[^>]*class=["'][^"']*(?:table|grid|mp_profile_table)[^"']*["'][^>]*>([\s\S]*?)<\/section>/gi, (_, tableHtml) => convertHtmlTableToMarkdown(tableHtml));
    clean = clean.replace(/<pre[^>]*><code[^>]*class=["'][^"']*language-([a-zA-Z0-9_-]+)[^"']*["'][^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, lang, code) => {
      const cleanCode = code.replace(/<span[^>]*class=["'][^"']*line-number[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "");
      return `

\`\`\`${lang}
${decodeEntities(stripTags(cleanCode))}
\`\`\`

`;
    });
    clean = clean.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
      const cleanCode = code.replace(/<span[^>]*class=["'][^"']*line-number[^"']*["'][^>]*>[\s\S]*?<\/span>/gi, "");
      return `

\`\`\`
${decodeEntities(stripTags(cleanCode))}
\`\`\`

`;
    });
    clean = clean.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_, code) => ` \`${decodeEntities(stripTags(code))}\` `);
    clean = clean.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, text) => `

> ${stripTags(text).split("\n").join("\n> ")}

`);
    clean = clean.replace(/<br\s*\/?>/gi, "\n");
    clean = clean.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, (_, text) => `

${stripTags(text)}

`);
    clean = clean.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, text) => `
- ${stripTags(text)}`);
    const noisyPhrases = [
      "\u9884\u89C8\u65F6\u6807\u7B7E\u4E0D\u53EF\u70B9",
      "\u5FAE\u4FE1\u626B\u4E00\u626B\u4F7F\u7528\u5C0F\u7A0B\u5E8F",
      "\u77E5\u9053\u4E86",
      "\u8F7B\u70B9\u4E24\u4E0B\u53D6\u6D88\u8D5E",
      "\u8F7B\u70B9\u4E24\u4E0B\u53D6\u6D88\u5728\u770B",
      "\u8BE5\u6587\u89C2\u70B9\u4EC5\u4EE3\u8868\u4F5C\u8005\u672C\u4EBA",
      "36\u6C2A\u5E73\u53F0\u4EC5\u63D0\u4F9B\u4FE1\u606F\u5B58\u50A8\u7A7A\u95F4\u670D\u52A1",
      "\u597D\u6587\u7AE0\uFF0C\u9700\u8981\u4F60\u7684\u9F13\u52B1",
      "\u6253\u5F00\u5FAE\u4FE1\u201C\u626B\u4E00\u626B\u201D",
      "\u6C89\u6D78\u9605\u8BFB",
      "\u8FD4\u56DE\u9876\u90E8"
    ];
    let result = clean.split("\n").map((line) => {
      let l = stripTags(normalizeSpaces(line)).trim();
      if (!l) return "";
      l = l.replace(/\*\*\s+/g, "**").replace(/\s+\*\*/g, "**");
      const count = (l.match(/\*\*/g) || []).length;
      if (count % 2 !== 0) {
        l = l.replace(/\*\*/g, "");
      }
      return l;
    }).filter((line) => !noisyPhrases.some((phrase) => line.includes(phrase))).join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (generateReferences && referencesList.length > 0) {
      const refSection = `

## References

` + referencesList.map((url, i) => `[${i + 1}] ${url}`).join("\n");
      result += refSection;
    }
    return decodeEntities(result);
  };
  var stripTags = (html) => {
    return html.replace(/<\/(?:td|th|div|span|p|section|li|h[1-6])>/gi, " ").replace(/<(?!img\b|br\b)[^>]+>/g, "").replace(/\s+/g, " ").trim();
  };
  var stripTagsPreserveLines = (html) => {
    return html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/p>/gi, "\n\n").replace(/<\/(?:div|section|li|h[1-6])>/gi, "\n").replace(/<(?!img\b|br\b)[^>]+>/g, "").replace(/\r\n?/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  };
  var toQuotedLines = (html) => {
    const text = stripTagsPreserveLines(html);
    return text.split("\n").map((line) => line.trim() ? "> " + line.trim() : ">").join("\n");
  };
  var extractMetadata = (html, platform) => {
    let account;
    let author;
    let publish_date;
    if (platform === "wechat") {
      const nickMatch = /var\s+nickname\s*=\s*["']([^"']+)["']/i.exec(html) || /class=["'][^"']*rich_media_meta_nickname[^"']*["'][^>]*>([\s\S]*?)<\/a>/i.exec(html);
      if (nickMatch?.[1]) account = decodeEntities(stripTags(nickMatch[1])).trim();
      const authorMatch = /var\s+(?:author|msg_author)\s*=\s*["']([^"']+)["']/i.exec(html) || /class=["'][^"']*rich_media_meta_text[^"']*["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
      if (authorMatch?.[1]) author = decodeEntities(stripTags(authorMatch[1])).trim();
      const ctMatch = /var\s+ct\s*=\s*["']?(\d{10})["']?/i.exec(html) || /id=["']publish_time["'][^>]*>([\s\S]*?)<\/em>/i.exec(html);
      if (ctMatch?.[1]) {
        const val = ctMatch[1].trim();
        if (/^\d{10}$/.test(val)) {
          const d = new Date(parseInt(val, 10) * 1e3);
          publish_date = d.toISOString().split("T")[0];
        } else {
          publish_date = decodeEntities(stripTags(val)).trim();
        }
      } else {
        const publishTimeMatch = /var\s+publish_time\s*=\s*["']([^"']*)["']/i.exec(html);
        const rawPublishTime = publishTimeMatch?.[1] ? decodeEntities(publishTimeMatch[1]).trim() : "";
        const dateParts = rawPublishTime.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
        publish_date = dateParts ? `${dateParts[1]}-${String(dateParts[2]).padStart(2, "0")}-${String(dateParts[3]).padStart(2, "0")}` : rawPublishTime || void 0;
      }
    } else {
      const authorMeta = /<meta\s+name=["']author["']\s+content=["']([^"']+)["']/i.exec(html);
      if (authorMeta?.[1]) author = decodeEntities(authorMeta[1]).trim();
      const dateMeta = /<meta\s+property=["']article:published_time["']\s+content=["']([^"']+)["']/i.exec(html) || /<meta\s+name=["']pubdate["']\s+content=["']([^"']+)["']/i.exec(html);
      if (dateMeta?.[1]) publish_date = dateMeta[1].split("T")[0];
    }
    return { account, author, publish_date };
  };
  function parseMarkdown(html, targetUrl = "") {
    const startTime = Date.now();
    const platform = detectPlatform(targetUrl, html);
    let rawHtml = html;
    let jsonTitle = "";
    let jsonAuthor = "";
    let jsonDate = "";
    if (html.trim().startsWith("{") && (html.includes('"content"') || html.includes('"answer_type"'))) {
      try {
        const data = JSON.parse(html);
        if (Array.isArray(data.segment_infos) && data.segment_infos.length > 0) {
          rawHtml = data.segment_infos.map((s) => s.text ? `<p>${s.text}</p>` : "").join("\n\n");
        } else if (data.content) {
          rawHtml = data.content;
        }
        const qTitle = data.question?.title || data.title || "";
        const aAuthor = data.author?.name || "";
        if (qTitle && aAuthor) {
          jsonTitle = `${qTitle} - ${aAuthor}\u7684\u56DE\u7B54`;
        } else if (qTitle) {
          jsonTitle = qTitle;
        }
        if (aAuthor) jsonAuthor = aAuthor;
        const timeVal = data.updated_time || data.created_time;
        if (timeVal) {
          const d = new Date(timeVal * 1e3);
          jsonDate = d.toISOString().split("T")[0];
        }
      } catch {
      }
    }
    const originalHtml = rawHtml;
    const embeddedJson = platform === "general" ? extractEmbeddedJsonContent(originalHtml) : null;
    if (!jsonTitle && embeddedJson?.title) jsonTitle = embeddedJson.title;
    const title = jsonTitle || extractTitle(originalHtml, targetUrl);
    const meta = extractMetadata(originalHtml, platform);
    if (jsonAuthor) meta.author = jsonAuthor;
    if (jsonDate) meta.publish_date = jsonDate;
    let extractedContent = embeddedJson?.content || rawHtml;
    let images = embeddedJson?.images || [];
    if (platform === "wechat") {
      const res = extractWeChatBody(html);
      extractedContent = res.content;
      images = res.images;
    } else if (platform === "xiaohongshu") {
      const res = extractXiaohongshuBody(html);
      extractedContent = res.content;
      images = res.images;
      if (res.account) meta.account = res.account;
      if (res.author) meta.author = res.author;
    } else if (platform === "zhihu") {
      const res = extractZhihuBody(rawHtml);
      extractedContent = res.content;
      images = res.images;
    } else if (platform === "sspai") {
      const res = extractSspaiBody(html);
      extractedContent = res.content;
      images = res.images;
      if (res.author) meta.author = res.author;
      if (res.publish_date) meta.publish_date = res.publish_date;
    } else if (platform === "kr36") {
      const res = extract36KrBody(html);
      extractedContent = res.content;
      images = res.images;
      if (res.author) meta.author = res.author;
      if (res.publish_date) meta.publish_date = res.publish_date;
    }
    let markdown = htmlToMarkdownFast(extractedContent, platform);
    if (markdown) {
      markdown = markdown.replace(/([。！？；，”’\)\s])\*\*/g, "$1");
      markdown = markdown.replace(/\*\*([。！？；，”’\)\s])/g, "$1");
      markdown = markdown.split("\n").map((line) => {
        let l = line.trim();
        const count = (l.match(/\*\*/g) || []).length;
        if (count % 2 !== 0) {
          l = l.replace(/\*\*/g, "");
        }
        return l;
      }).join("\n");
      markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();
    }
    const hasExtractedImage = images.some((url) => markdown.includes(url));
    if (images.length > 0 && !hasExtractedImage) {
      const imageMarkdown = images.map((url, idx) => {
        return `![\u56FE\u7247 ${idx + 1}](${url})`;
      }).join("\n\n");
      markdown = markdown ? `${markdown}

${imageMarkdown}` : imageMarkdown;
    }
    if (!markdown.trim()) {
      markdown = `> \u65E0\u53EF\u8F6C\u6362\u7684\u7EAF\u6587\u672C\u5185\u5BB9\u3002\u63D0\u53D6\u5230\u7684\u56FE\u7247\u5217\u8868\uFF1A

` + images.map((url, idx) => {
        return `![\u56FE\u7247 ${idx + 1}](${url})`;
      }).join("\n\n");
    }
    markdown = markdown.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ").replace(/\u200b/g, "").replace(/\ufeff/g, "").replace(/\ufffd/g, "");
    markdown = markdown.split("\n").map((line) => {
      let l = line.trim();
      const count = (l.match(/\*\*/g) || []).length;
      if (count % 2 !== 0) {
        l = l.replace(/\*\*/g, "");
      }
      return l;
    }).join("\n");
    const plainTextLength = markdown.replace(/!\[.*?\]\(.*?\)/g, "").replace(/<[^>]+>/g, "").trim().length;
    const wordCount = plainTextLength;
    const readingTimeMin = Math.max(1, Math.ceil(wordCount / 350));
    let domain = "";
    try {
      if (targetUrl.startsWith("http")) {
        domain = new URL(targetUrl).hostname;
      }
    } catch {
    }
    const savedAt = (/* @__PURE__ */ new Date()).toISOString();
    const yamlLines = ["---"];
    yamlLines.push(`source_url: "${targetUrl}"`);
    yamlLines.push(`title: "${title.replace(/"/g, '\\"')}"`);
    if (meta.account) yamlLines.push(`account: "${meta.account.replace(/"/g, '\\"')}"`);
    if (meta.author) yamlLines.push(`author: "${meta.author.replace(/"/g, '\\"')}"`);
    if (meta.publish_date) yamlLines.push(`published_at: "${meta.publish_date}"`);
    yamlLines.push(`saved_at: "${savedAt}"`);
    yamlLines.push(`platform: ${platform}`);
    if (domain) yamlLines.push(`domain: "${domain}"`);
    yamlLines.push(`word_count: ${wordCount}`);
    yamlLines.push(`reading_time: "${readingTimeMin} min"`);
    yamlLines.push(`tags:`);
    yamlLines.push(`  - herdown`);
    yamlLines.push(`  - herdown/${platform}`);
    yamlLines.push(`  - clippings`);
    yamlLines.push(`parse_status: ok`);
    yamlLines.push("---");
    const frontmatter = yamlLines.join("\n");
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
      elapsed_ms: Math.max(1, elapsed_ms)
    };
  }
  var extractSitemapUrls = (xmlOrHtml, baseUrl, limit = 10) => {
    const urls = [];
    const locRegex = /<loc>([\s\S]*?)<\/loc>/gi;
    let match;
    while ((match = locRegex.exec(xmlOrHtml)) !== null) {
      const url = match[1].trim();
      if (url.startsWith("http") && !urls.includes(url)) {
        urls.push(url);
        if (urls.length >= limit) return urls;
      }
    }
    let domain = baseUrl;
    try {
      domain = new URL(baseUrl).origin;
    } catch {
    }
    const hrefRegex = /<a\s+[^>]*href=["']([^"']+)["']/gi;
    while ((match = hrefRegex.exec(xmlOrHtml)) !== null) {
      let href = match[1].trim();
      if (href.startsWith("/")) {
        href = `${domain}${href}`;
      }
      if (href.startsWith(domain) && !urls.includes(href) && !href.includes("#")) {
        urls.push(href);
        if (urls.length >= limit) return urls;
      }
    }
    return urls.length > 0 ? urls : [baseUrl];
  };
  var chunkMarkdownForRAG = (markdown, maxChunkSize = 500) => {
    const paragraphs = markdown.split(/\n\n+/);
    const chunks = [];
    let currentChunk = "";
    let chunkIdx = 1;
    for (const para of paragraphs) {
      if ((currentChunk + "\n\n" + para).length > maxChunkSize && currentChunk) {
        chunks.push({
          chunk_index: chunkIdx++,
          content: currentChunk.trim(),
          word_count: currentChunk.trim().split(/\s+/).length
        });
        currentChunk = para;
      } else {
        currentChunk = currentChunk ? `${currentChunk}

${para}` : para;
      }
    }
    if (currentChunk.trim()) {
      chunks.push({
        chunk_index: chunkIdx,
        content: currentChunk.trim(),
        word_count: currentChunk.trim().split(/\s+/).length
      });
    }
    return chunks;
  };
  return __toCommonJS(index_exports);
})();
