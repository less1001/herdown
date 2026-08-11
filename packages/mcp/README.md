# @herdown/mcp

MCP stdio adapter for the Herdown webpage parsing and site-crawling service.

## Configure an MCP client

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

The endpoint can be replaced with the first command-line argument or the `HERDOWN_MCP_ENDPOINT` environment variable. The default adapter forwards requests to the hosted Herdown MCP endpoint.

See the full [MCP guide](../../docs/mcp.md) and the [Herdown MCP page](https://herdown.com/mcp).

## License

MIT. See the repository [LICENSE](../../LICENSE).
