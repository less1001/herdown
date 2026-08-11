#!/usr/bin/env node
import readline from 'node:readline';

const endpoint = process.argv[2] || process.env.HERDOWN_MCP_ENDPOINT || 'https://api.herdown.com/mcp';
const apiKey = process.env.HERDOWN_API_KEY?.trim();

type JsonRpcRequest = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
};

const send = (value: unknown): void => {
  process.stdout.write(`${JSON.stringify(value)}\n`);
};

const errorResponse = (id: JsonRpcRequest['id'], code: number, message: string) => ({
  jsonrpc: '2.0',
  id: id ?? null,
  error: { code, message },
});

const handle = async (request: JsonRpcRequest): Promise<void> => {
  if (!request.method) {
    send(errorResponse(request.id, -32600, 'Invalid Request'));
    return;
  }

  try {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      accept: 'application/json, text/event-stream',
    };
    if (apiKey) headers.authorization = `Bearer ${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });
    const payload = await response.json().catch(() => null);
    if (payload && typeof payload === 'object') {
      send(payload);
      return;
    }
    send(errorResponse(request.id, -32000, `MCP endpoint returned HTTP ${response.status}`));
  } catch (error) {
    send(errorResponse(request.id, -32000, error instanceof Error ? error.message : 'MCP request failed'));
  }
};

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
let queue = Promise.resolve();
input.on('line', line => {
  if (!line.trim()) return;
  let request: JsonRpcRequest;
  try {
    request = JSON.parse(line) as JsonRpcRequest;
  } catch {
    send(errorResponse(null, -32700, 'Parse error'));
    return;
  }
  queue = queue.then(() => handle(request));
});
