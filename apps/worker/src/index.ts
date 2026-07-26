import { parseMarkdown, detectPlatform, ParseResult } from '@mdforagents/core';

export interface Env {
  DB?: D1Database;
  APP_NAME?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

const json = (data: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS, DELETE');
  headers.set('access-control-allow-headers', 'Content-Type, Authorization');
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
};

const getClientIp = (request: Request): string => {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '127.0.0.1';
};

const verifyApiKeyOrIp = async (request: Request, env: Env): Promise<{ keyOrIp: string; isKey: boolean; userId: string }> => {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && env.DB) {
    try {
      const res = await env.DB.prepare('SELECT user_id, status FROM api_keys WHERE key = ?').bind(token).first<{ user_id: string; status: string }>();
      if (res && res.status === 'active') {
        return { keyOrIp: token, isKey: true, userId: res.user_id };
      }
    } catch {
      // Fallback if D1 is not initialized
    }
  }

  return { keyOrIp: getClientIp(request), isKey: false, userId: 'usr_anonymous' };
};

const logUsage = async (keyOrIp: string, env: Env): Promise<number> => {
  const dateStr = new Date().toISOString().slice(0, 10);
  if (!env.DB) return 1;

  try {
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(keyOrIp, dateStr).run();

    const row = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(keyOrIp, dateStr)
      .first<{ count: number }>();

    return row?.count || 1;
  } catch {
    return 1;
  }
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS, DELETE',
          'access-control-allow-headers': 'Content-Type, Authorization',
        },
      });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return json({
        status: 'ok',
        app: env.APP_NAME || 'mdforagents',
        version: '2.4.0',
        timestamp: new Date().toISOString(),
      });
    }

    // REST API Endpoint: POST /v1/parse
    if (url.pathname === '/v1/parse' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      
      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; include_images?: boolean };
      const targetUrl = (body.url || '').trim();
      const rawHtml = body.html || '';

      if (!targetUrl && !rawHtml) {
        return json({
          success: false,
          code: 'INVALID_URL',
          message: 'Parameter "url" or "html" is required.',
        }, { status: 400 });
      }

      if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
        return json({
          success: false,
          code: 'INVALID_URL',
          message: 'Invalid URL format. Must start with http:// or https://',
        }, { status: 400 });
      }

      // Log usage and check rate limits
      const countToday = await logUsage(authInfo.keyOrIp, env);
      const limit = authInfo.isKey ? 10000 : 500; // Anonymous IP: 500/day, API Key: 10000/day
      if (countToday > limit) {
        return json({
          success: false,
          code: 'RATE_LIMIT',
          message: `Daily rate limit exceeded (${limit} requests/day). Please use a valid API Key.`,
        }, { status: 429 });
      }

      try {
        let sourceHtml = rawHtml;
        if (!sourceHtml && targetUrl) {
          const platform = detectPlatform(targetUrl);
          const referer = platform === 'xiaohongshu' ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/';

          const fetchRes = await fetch(targetUrl, {
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'referer': referer,
            },
          });

          if (!fetchRes.ok) {
            return json({
              success: false,
              code: 'PARSE_FAILED',
              message: `Target page returned HTTP status ${fetchRes.status}`,
            }, { status: 500 });
          }

          sourceHtml = await fetchRes.text();
        }

        const result: ParseResult = parseMarkdown(sourceHtml, targetUrl);

        return json({
          success: true,
          title: result.title,
          markdown: result.markdown,
          images: result.images,
          platform: result.platform,
          elapsed_ms: result.elapsed_ms,
        });
      } catch (err: any) {
        return json({
          success: false,
          code: 'PARSE_FAILED',
          message: err?.message || 'Failed to fetch or parse target URL',
        }, { status: 500 });
      }
    }

    // Dashboard API: API Key Management
    if (url.pathname === '/v1/keys' && request.method === 'GET') {
      if (!env.DB) {
        return json({ keys: [{ key: 'sk_live_REDACTED', name: 'Default Key', created_at: new Date().toISOString(), status: 'active' }] });
      }
      try {
        const { results } = await env.DB.prepare('SELECT key, name, status, created_at FROM api_keys ORDER BY created_at DESC').all();
        return json({ keys: results || [] });
      } catch {
        return json({ keys: [] });
      }
    }

    if (url.pathname === '/v1/keys' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { name?: string };
      const keyName = (body.name || 'API Key').trim();
      const newKey = `sk_live_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
      const userId = 'usr_default';

      if (env.DB) {
        try {
          await env.DB.prepare('INSERT INTO api_keys (key, user_id, name, status) VALUES (?, ?, ?, ?)').bind(newKey, userId, keyName, 'active').run();
        } catch (e: any) {
          return json({ success: false, message: e?.message || 'Database insert error' }, { status: 500 });
        }
      }

      return json({ success: true, key: newKey, name: keyName, created_at: new Date().toISOString() });
    }

    if (url.pathname.startsWith('/v1/keys/') && request.method === 'DELETE') {
      const keyToDelete = url.pathname.replace('/v1/keys/', '');
      if (env.DB && keyToDelete) {
        try {
          await env.DB.prepare('UPDATE api_keys SET status = "revoked" WHERE key = ?').bind(keyToDelete).run();
        } catch {
          // ignore
        }
      }
      return json({ success: true, key: keyToDelete });
    }

    // Dashboard API: Usage Statistics
    if (url.pathname === '/v1/usage' && request.method === 'GET') {
      const dateStr = new Date().toISOString().slice(0, 10);
      let todayCount = 0;
      let totalKeys = 1;

      if (env.DB) {
        try {
          const row = await env.DB.prepare('SELECT SUM(count) as total FROM usage_logs WHERE parse_date = ?').bind(dateStr).first<{ total: number }>();
          todayCount = row?.total || 0;

          const keysRow = await env.DB.prepare('SELECT COUNT(*) as cnt FROM api_keys WHERE status = "active"').first<{ cnt: number }>();
          totalKeys = keysRow?.cnt || 1;
        } catch {
          // ignore
        }
      }

      return json({
        today_requests: todayCount,
        daily_quota: 50000,
        active_keys: totalKeys,
      });
    }

    // Anthropic MCP Remote Endpoint: GET/POST /mcp
    if (url.pathname === '/mcp') {
      if (request.method === 'GET') {
        return json({
          name: env.APP_NAME || 'mdforagents',
          protocol: 'mcp',
          transport: 'http',
          endpoint: '/mcp',
          status: 'ready',
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as {
          jsonrpc?: string;
          id?: string | number | null;
          method?: string;
          params?: Record<string, unknown>;
        } | null;

        if (!body?.method) {
          return json({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32600, message: 'Invalid Request' } }, { status: 400 });
        }

        if (body.method === 'initialize') {
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: { name: 'MD for Agents MCP Server', version: '2.4.0' },
              capabilities: { tools: {} },
            },
          });
        }

        if (body.method === 'tools/list') {
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              tools: [
                {
                  name: 'parse_webpage',
                  description: 'Parse public web pages (WeChat, Xiaohongshu, Zhihu, etc.) into clean Markdown formatted for AI Agents.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', description: 'The public HTTP/HTTPS URL of the target article or web page' },
                      html: { type: 'string', description: 'Optional raw HTML string if URL is not directly accessible' },
                    },
                    required: ['url'],
                  },
                },
                {
                  name: 'health_check',
                  description: 'Check MD for Agents backend service status.',
                  inputSchema: { type: 'object', properties: {} },
                },
              ],
            },
          });
        }

        if (body.method === 'tools/call') {
          const toolName = String(body.params?.name ?? '');
          const args = (body.params?.arguments ?? {}) as { url?: string; html?: string };

          if (toolName === 'health_check') {
            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: { content: [{ type: 'text', text: 'Service Operational. Version 2.4.0' }] },
            });
          }

          if (toolName === 'parse_webpage') {
            const targetUrl = (args.url || '').trim();
            let sourceHtml = args.html || '';

            if (targetUrl && !sourceHtml) {
              const platform = detectPlatform(targetUrl);
              const referer = platform === 'xiaohongshu' ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/';
              const res = await fetch(targetUrl, {
                headers: {
                  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                  'referer': referer,
                },
              }).catch(() => null);
              if (res && res.ok) {
                sourceHtml = await res.text();
              }
            }

            const parsed = parseMarkdown(sourceHtml, targetUrl);

            return json({
              jsonrpc: '2.0',
              id: body.id ?? null,
              result: {
                content: [{ type: 'text', text: parsed.markdown }],
                structuredContent: parsed,
              },
            });
          }
        }

        return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });
      }
    }

    // Static Assets Fallback (Serves TanStack Web SPA)
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch {
        // Fallback below
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
