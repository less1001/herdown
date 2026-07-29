# Herdown

> Convert any webpage into clean, structured Markdown for AI agents.

**Herdown** (https://herdown.com) is an open-source, ultra-fast Markdown conversion platform built for AI Agents, developers, and automated workflows. It provides custom parsers for complex Chinese content ecosystems (WeChat Official Accounts, Xiaohongshu Notes, Zhihu Answers with LaTeX), as well as universal webpage extraction.

---

## Features

- 🟢 **WeChat Articles**: Preserves complete image sequence (anti-hotlink bypass with `no-referrer`), extracts account name, author, and timestamp.
- 🔴 **Xiaohongshu Notes**: Parses `__INITIAL_STATE__` JSON to extract high-resolution `H5_DTL` images with note-ID deduplication.
- 🔵 **Zhihu Answers/Columns**: Preserves inline and block LaTeX formulas (`$ ... $` & `$$ ... $$`).
- ⚡ **Ultra Fast**: Core parser runs in < 2ms without heavy headless browsers.
- 📦 **Monorepo Architecture**: Includes REST API, CLI tool (`@herdown/cli`), MCP adapter, and React web console.

---

## Monorepo Structure

- `apps/worker`: Serverless API endpoint hosted on Cloudflare Workers (`https://api.herdown.com`)
- `apps/web`: React web console (`https://herdown.com`)
- `packages/core`: Core HTML parsing, image deduplication, and markdown normalization engine (`@herdown/core`)
- `packages/cli`: Standalone bundled CLI executable (`@herdown/cli` / `npx @herdown/cli`)
- `packages/mcp`: Model Context Protocol integration (`@herdown/mcp`)

---

## Quick Start

### Using CLI

```bash
# Run directly with npx
npx @herdown/cli "https://example.com/article" -o output.md

# Or install globally
npm install -g @herdown/cli
herdown "https://example.com/article" -o output.md
```

### Using REST API

```bash
curl -X POST "https://api.herdown.com/v1/parse" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com/article"}'
```

---

## License

MIT © 2026 Herdown
