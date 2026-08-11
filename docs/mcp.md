# Herdown MCP

`@herdown/mcp` is a small stdio adapter that lets an MCP-compatible client forward JSON-RPC requests to a Herdown MCP endpoint.

The default endpoint is the hosted service at `https://api.herdown.com/mcp`. The adapter does not itself replace the hosted parser, crawler, authentication, or quota service.

## Client configuration

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

The first argument overrides the endpoint:

```bash
npx @herdown/mcp "https://api.herdown.com/mcp"
```

You can also set the endpoint through the environment:

```bash
export HERDOWN_MCP_ENDPOINT="https://api.herdown.com/mcp"
export HERDOWN_API_KEY="YOUR_API_KEY"
npx @herdown/mcp
```

The endpoint can be replaced with a self-hosted compatible MCP service. The client command and environment variable shape remain the same.

## Hosted capabilities

Depending on the endpoint and account permissions, Herdown exposes agent workflows for:

- Single webpage parsing
- Multi-page website crawling
- Sitemap-based crawling
- Webpage screenshots
- Structured content and Markdown preparation

Check the live [MCP page](https://herdown.com/mcp) and [API documentation](https://herdown.com/docs) for the current endpoint behavior and quota rules.

## Security

Keep `HERDOWN_API_KEY` in a protected environment. Do not paste it into a public prompt, repository, issue, screenshot, or frontend bundle.

Only send URLs and content that you are allowed to process. Login walls, private pages, and restricted resources are outside the normal public-web workflow.

## Troubleshooting

- If the client cannot start the server, verify that Node.js and `npx` are available.
- If initialization fails, check the endpoint URL and network access.
- If a request is rejected, check the API key, quota, and endpoint permissions.
- If the result is incomplete, use the matching Herdown tool or the browser extension for a local workflow.

See the [MCP product page](https://herdown.com/mcp), [CLI guide](cli.md), and [issue tracker](https://github.com/less1001/herdown/issues).
