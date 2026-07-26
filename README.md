# mdforagents

Markdown conversion platform for agents.

## Structure

- `apps/worker`: Cloudflare Worker API and MCP endpoint
- `apps/web`: TanStack React web console
- `packages/core`: shared parser and normalization logic
- `packages/cli`: `npx mdforagents` wrapper
- `packages/mcp`: MCP client/server adapter

## Notes

- pnpm only
- Cloudflare Workers + D1 backend
- TanStack-based web app

