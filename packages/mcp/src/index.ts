export function createMcpServerConfig(remoteEndpoint = 'https://api.herdown.com/mcp', apiKey = 'sk_live_demo88888888') {
  return {
    mcpServers: {
      herdown: {
        command: 'npx',
        args: ['-y', '@herdown/mcp', remoteEndpoint],
        env: {
          HERDOWN_API_KEY: apiKey,
        },
      },
    },
  };
}
