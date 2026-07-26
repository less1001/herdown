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
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
};

// Security Check: SSRF & Internal IP Protection
const isForbiddenUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) return true;

    // Block localhost, private IPs, and internal domains
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '::1' ||
      host.endsWith('.local') ||
      host.endsWith('.internal') ||
      /^10\./.test(host) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
      /^192\.168\./.test(host)
    ) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
};

const verifyApiKeyOrIp = async (request: Request, env: Env): Promise<{ keyOrIp: string; isKey: boolean; userId: string }> => {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token && token !== 'sk_live_REDACTED' && env.DB) {
    try {
      const res = await env.DB.prepare('SELECT user_id, status FROM api_keys WHERE key = ?').bind(token).first<{ user_id: string; status: string }>();
      if (res && res.status === 'active') {
        return { keyOrIp: token, isKey: true, userId: res.user_id };
      }
    } catch {
      // ignore
    }
  }

  return { keyOrIp: getClientIp(request), isKey: false, userId: 'usr_anonymous' };
};

// Minute + Daily Rate Limiter
const checkAndLogRateLimit = async (keyOrIp: string, isKey: boolean, env: Env): Promise<{ allowed: boolean; reason?: string }> => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const minuteStr = new Date().toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm

  // Limits: Anonymous (10/min, 100/day); API Key (30/min, 2000/day)
  const maxPerMinute = isKey ? 30 : 10;
  const maxPerDay = isKey ? 2000 : 100;

  if (!env.DB) return { allowed: true };

  try {
    // 1. Minute check
    const minuteKey = `min:${keyOrIp}:${minuteStr}`;
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(minuteKey, minuteStr).run();

    const minRow = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(minuteKey, minuteStr)
      .first<{ count: number }>();

    if (minRow && minRow.count > maxPerMinute) {
      return { allowed: false, reason: `每分钟请求频率超限 (最高 ${maxPerMinute} 次/分钟)` };
    }

    // 2. Daily check
    const dailyKey = `day:${keyOrIp}:${dateStr}`;
    await env.DB.prepare(`
      INSERT INTO usage_logs (key_or_ip, parse_date, count)
      VALUES (?, ?, 1)
      ON CONFLICT(key_or_ip, parse_date) DO UPDATE SET count = count + 1
    `).bind(dailyKey, dateStr).run();

    const dayRow = await env.DB.prepare('SELECT count FROM usage_logs WHERE key_or_ip = ? AND parse_date = ?')
      .bind(dailyKey, dateStr)
      .first<{ count: number }>();

    if (dayRow && dayRow.count > maxPerDay) {
      return { allowed: false, reason: `每日解析配额已达上限 (${maxPerDay} 次/日)` };
    }
  } catch {
    // Fallback allowing request if D1 temporary glitch
  }

  return { allowed: true };
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
      
      // Strict Rate Limiting Check
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({
          success: false,
          code: 'RATE_LIMIT',
          message: rateLimitResult.reason || '请求过于频繁，已被系统封禁',
        }, { status: 429 });
      }

      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; include_images?: boolean };
      const targetUrl = (body.url || '').trim();
      const rawHtml = body.html || '';

      if (!targetUrl && !rawHtml) {
        return json({
          success: false,
          code: 'INVALID_URL',
          message: '请传入 url 参数或 html 源码',
        }, { status: 400 });
      }

      if (targetUrl && isForbiddenUrl(targetUrl)) {
        return json({
          success: false,
          code: 'INVALID_URL',
          message: '禁止解析内网、本地或非法协议 URL',
        }, { status: 400 });
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
              message: `目标网页返回 HTTP 错误码 ${fetchRes.status}`,
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
          message: err?.message || '抓取或解析目标网页失败',
        }, { status: 500 });
      }
    }

    // Dashboard API: API Key Management
    if (url.pathname === '/v1/keys' && request.method === 'GET') {
      if (!env.DB) {
        return json({ keys: [] });
      }
      try {
        const { results } = await env.DB.prepare('SELECT key, name, status, created_at FROM api_keys WHERE status != "revoked" ORDER BY created_at DESC').all();
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
          return json({ success: false, message: e?.message || '数据库写入失败' }, { status: 500 });
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
      let totalKeys = 0;

      if (env.DB) {
        try {
          const row = await env.DB.prepare('SELECT SUM(count) as total FROM usage_logs WHERE parse_date = ? AND key_or_ip LIKE "day:%"').bind(dateStr).first<{ total: number }>();
          todayCount = row?.total || 0;

          const keysRow = await env.DB.prepare('SELECT COUNT(*) as cnt FROM api_keys WHERE status = "active"').first<{ cnt: number }>();
          totalKeys = keysRow?.cnt || 0;
        } catch {
          // ignore
        }
      }

      return json({
        today_requests: todayCount,
        daily_quota: 100000,
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

            if (targetUrl && isForbiddenUrl(targetUrl)) {
              return json({
                jsonrpc: '2.0',
                id: body.id ?? null,
                error: { code: -32602, message: 'Invalid URL: Internal or private IP addresses forbidden' },
              });
            }

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
