export function createMcpServerConfig(remoteEndpoint = 'https://allto.agentok.top/mcp', apiKey = 'sk_live_REDACTED') {
  return {
    mcpServers: {
      mdforagents: {
        command: 'npx',
        args: ['-y', '@mdforagents/mcp', remoteEndpoint],
        env: {
          MDFORAGENTS_API_KEY: apiKey,
        },
      },
    },
  };
}
