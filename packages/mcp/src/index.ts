export function createMcpServerConfig(remoteEndpoint = 'https://api.herdown.com/mcp', apiKey?: string) {
  const env = apiKey ? { HERDOWN_API_KEY: apiKey } : {};
  return {
    mcpServers: {
      herdown: {
        command: 'npx',
        args: ['-y', '@herdown/mcp', remoteEndpoint],
        env,
      },
    },
  };
}
