# Herdown

[Herdown](https://herdown.com) turns public webpages and local material workflows into clean Markdown for AI agents, developers, and knowledge tools.

This repository is the official open-source monorepo for the Herdown web application, API worker, parser core, CLI, MCP adapter, and browser extension.

[![Validate](https://github.com/less1001/herdown/actions/workflows/ci.yml/badge.svg)](https://github.com/less1001/herdown/actions/workflows/ci.yml)
[![Website](https://img.shields.io/badge/website-herdown.com-10b981)](https://herdown.com)
[![npm CLI](https://img.shields.io/npm/v/%40herdown%2Fcli?label=%40herdown%2Fcli)](https://www.npmjs.com/package/@herdown/cli)

## What Herdown provides

- Webpage to Markdown with source-aware extraction
- Local document workflows for Markdown, TXT, Word, PDF, PPT, Excel, CSV, JSON, XML, and RTF
- Website crawling through the hosted API and the Website to Markdown tool
- Platform-aware extraction for WeChat articles, Xiaohongshu notes, Zhihu content, and general webpages
- REST API, MCP, CLI, Skill, browser extension, and browser-based tools
- Markdown review and publishing workflows for HTML, PDF, Word, WeChat, and Xiaohongshu

The project keeps local processing and hosted processing separate. Use local tools when the input should stay on your computer. Use the hosted API or MCP endpoint for repeatable automation, site crawling, and managed quotas.

## Choose a mode

| Mode | Best for | Herdown service required |
| --- | --- | --- |
| Web app | No-code conversion and publishing workflows | Depends on the selected tool |
| CLI local mode | One public webpage from a terminal | No |
| CLI remote mode | API automation, managed parsing, and account quotas | Yes |
| MCP | AI agent tool discovery and hosted parsing or crawling | Yes by default |
| Browser extension | Local extraction of the current rendered page | No |

## Quick start

### CLI local mode

```bash
npx @herdown/cli "https://example.com/article"
npx @herdown/cli "https://example.com/article" -o article.md
```

The CLI fetches the public page and parses it locally when no API key is supplied. Protected pages, login-required pages, JavaScript-only pages, and some platform-specific content may need the hosted API or the browser extension.

### CLI remote mode

```bash
export HERDOWN_API_URL="https://api.herdown.com"
npx @herdown/cli "https://example.com/article" --key "$HERDOWN_API_KEY" -o article.md
```

Keep API keys in the shell environment or another protected secret store. Do not place them in frontend code, public repositories, or issue reports.

### MCP

Add the following server to an MCP client that supports stdio servers:

```json
{
  "mcpServers": {
    "herdown": {
      "command": "npx",
      "args": ["-y", "@herdown/mcp", "https://api.herdown.com/mcp"],
      "env": {
        "HERDOWN_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

The adapter accepts a custom endpoint as its first argument or through `HERDOWN_MCP_ENDPOINT`, so a self-hosted compatible endpoint can be used without changing the client configuration shape.

## Repository layout

- `apps/web`: React web application for [herdown.com](https://herdown.com)
- `apps/worker`: Cloudflare Worker for the API, authentication, quotas, and hosted parsing
- `packages/core`: shared parser and Markdown normalization code
- `packages/cli`: `@herdown/cli`, a bundled terminal client
- `packages/mcp`: `@herdown/mcp`, an MCP stdio adapter for the hosted endpoint
- `apps/extension`: browser extension source
- `docs`: developer documentation for CLI and MCP integration

## Documentation

- [CLI guide](docs/cli.md)
- [MCP guide](docs/mcp.md)
- [Developer documentation](https://herdown.com/docs)
- [CLI page](https://herdown.com/cli)
- [MCP page](https://herdown.com/mcp)
- [REST API](https://herdown.com/api)
- [Website to Markdown](https://herdown.com/website-to-markdown)
- [Online Herdown tools](https://herdown.com/tools)

## Local development

Requirements:

- Node.js 22 or newer
- pnpm 10.12.1

```bash
pnpm install
pnpm check
pnpm build
```

Run the web application, worker, or CLI during development:

```bash
pnpm dev:web
pnpm dev:worker
pnpm dev:cli -- "https://example.com/article"
```

The worker requires the environment bindings described by `apps/worker/wrangler.toml`. Never commit local secrets or production credentials.

## Privacy and responsible use

Only process pages and files that you are allowed to access and transform. Respect website terms, robots rules, copyright, privacy, and platform restrictions. Herdown does not grant permission to bypass login walls or access private content.

The browser-based local tools process supported files in the current browser. The hosted API and MCP endpoint receive the URL or request needed to perform the selected remote operation. Check the [privacy policy](https://herdown.com/privacy) and [terms](https://herdown.com/terms) before using hosted processing.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening an issue or pull request. Bug reports should include the input type, expected output, actual output, and a safe public reproduction when possible. Do not include private documents, API keys, cookies, or personal data.

Security reports should follow [SECURITY.md](SECURITY.md).

## License

Herdown is released under the [MIT License](LICENSE).
