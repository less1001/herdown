---
name: mdforagents
description: Complete Web-to-Markdown, Sitemap Crawling, Webpage Screenshotting, and RAG Vector Chunking Skill for AI Agents (Hermes, Claude Code, OpenClaw, QClaw, Antigravity). Activates when fetching web pages, extracting WeChat articles, Xiaohongshu notes, Zhihu answers with LaTeX formulas, crawling sitemaps, or preparing clean markdown for RAG indexing.
---

# MD for Agents — AI Agent Skill Reference

`mdforagents` is an edge-accelerated, zero-overhead Web-to-Markdown parser and scraper toolchain specifically engineered for Autonomous AI Agents and RAG Pipelines.

---

## 🚀 Quick Usage (CLI Mode)

Agents can execute `mdforagents` via terminal/shell without prior global installation:

```bash
# 1. Parse any URL directly to terminal stdout
npx mdforagents "https://mp.weixin.qq.com/s/kJqhegRPFIQpH0-yBGaWiA"

# 2. Extract URL content and save to local Markdown file
npx mdforagents "https://zhuanlan.zhihu.com/p/xxxxx" -o article.md

# 3. Execute with custom API Key (Unlocks 2,000~50,000 daily requests)
npx mdforagents "https://www.xiaohongshu.com/explore/xxxxx" -k "sk_live_pro_your_key" -o xhs.md
```

---

## 📡 REST API Reference

When shell execution is restricted, agents can perform standard HTTP POST requests:

### 1. Single Page Parse (`POST /v1/parse`)
Extracts clean Markdown, title, and deduplicated image URLs from any public URL.

```bash
curl -X POST https://allto.agentok.top/v1/parse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"url": "https://mp.weixin.qq.com/s/kJqhegRPFIQpH0-yBGaWiA"}'
```

**JSON Response:**
```json
{
  "success": true,
  "title": "创业随笔，26号~",
  "markdown": "# 创业随笔，26号~\n\nJUST MARK。\n今早拉引体时...",
  "images": ["https://mmbiz.qpic.cn/..."],
  "platform": "wechat",
  "elapsed_ms": 13
}
```

---

### 2. Sitemap & Recursive Crawl (`POST /v1/crawl`)
Recursively discovers and parses all subpages under a domain or sitemap XML.

```bash
curl -X POST https://allto.agentok.top/v1/crawl \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"url": "https://example.com", "limit": 10}'
```

---

### 3. Webpage Viewport Screenshot (`POST /v1/screenshot`)
Generates a high-definition 1200x800 PNG viewport screenshot of any target URL.

```bash
curl -X POST https://allto.agentok.top/v1/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://news.ycombinator.com"}'
```

---

### 4. RAG Vector Chunking (`POST /v1/vectorize`)
Splits extracted Markdown into semantic vector chunks ready for RAG embeddings (Milvus / Qdrant / Pinecone).

```bash
curl -X POST https://allto.agentok.top/v1/vectorize \
  -H "Content-Type: application/json" \
  -d '{"url": "https://wikipedia.org", "chunk_size": 400}'
```

---

## 🎯 Platform-Specific Extraction Enhancements

- **WeChat Official Accounts (`mp.weixin.qq.com`)**: 100% full-text extraction without truncation. Strips watermark info and extracts deduplicated photo gallery CDN links (`cdn_url`).
- **Zhihu (`zhihu.com`)**: Preserves mathematical LaTeX formulas inline as `$ ... $` syntax.
- **Xiaohongshu (`xiaohongshu.com`)**: Extracts note text description and deduplicated high-definition `xhscdn.com` images.
- **Wikipedia & General Web**: Strips navigation menus, footer ads, and cookie banners automatically.

---

## 🛡️ Safeguards & Error Handling

- **Rate Limit (HTTP 429)**: Anonymous IPs get 5~20 free daily quota. Provide a valid Bearer Key to upgrade limit.
- **Max Content Size**: 10MB payload limit per webpage. Super-sized pages are safely truncated.
- **Fetch Timeout**: 8-second strict timeout per outbound page fetch.
- **SSRF Protection**: Private IP ranges (`127.0.0.1`, `10.x.x.x`, `192.168.x.x`) are automatically blocked.
