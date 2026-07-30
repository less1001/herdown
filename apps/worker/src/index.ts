import { parseMarkdown, detectPlatform, extractSitemapUrls, chunkMarkdownForRAG, ParseResult } from '@herdown/core';

export interface Env {
  DB?: D1Database;
  APP_NAME?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
}

const json = (data: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, POST, OPTIONS, DELETE');
  headers.set('access-control-allow-headers', 'Content-Type, Authorization, Stripe-Signature');
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers,
  });
};

const getClientIp = (request: Request): string => {
  return request.headers.get('cf-connecting-ip') || request.headers.get('x-real-ip') || '127.0.0.1';
};

const isForbiddenUrl = (urlString: string): boolean => {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) return true;

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

const checkAndLogRateLimit = async (keyOrIp: string, isKey: boolean, env: Env): Promise<{ allowed: boolean; reason?: string }> => {
  const dateStr = new Date().toISOString().slice(0, 10);
  const minuteStr = new Date().toISOString().slice(0, 16);

  const maxPerMinute = isKey ? 20 : 5;
  const maxPerDay = isKey ? 100 : 20;

  if (!env.DB) return { allowed: true };

  try {
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
      return { allowed: false, reason: `请求太频繁！已达到限制 (${maxPerMinute} 次/分钟)` };
    }

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
      return { allowed: false, reason: `已达到今日解析配额上限 (${maxPerDay} 次/天)` };
    }
  } catch {
    // Fallback
  }

  return { allowed: true };
};

const MAX_PAYLOAD_BYTES = 10 * 1024 * 1024; // 10MB 防爆内存限制

async function safeFetchPageHtml(targetUrl: string, referer?: string, timeoutMs = 8000, zhihuLimit = 5, zhihuSort = 'default'): Promise<{ html: string; status: number }> {
  // Check if URL is zhihu.com to rewrite fetch request to mobile API
  if (targetUrl.includes('zhihu.com/question/')) {
    try {
      const qidMatch = /question\/(\d+)/.exec(targetUrl);
      const aidMatch = /answer\/(\d+)/.exec(targetUrl);
      const headers = {
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'accept': 'application/json',
      };

      if (aidMatch) {
        // Fetch single answer
        const answerId = aidMatch[1];
        const apiRes = await fetch(`https://api.zhihu.com/answers/${answerId}`, { headers });
        if (apiRes.ok) {
          const data: any = await apiRes.json();
          const mockHtml = `
            <html>
              <head>
                <title>${data.question?.title || '知乎问答'}</title>
                <meta name="author" content="${data.author?.name || '知乎用户'}" />
              </head>
              <body>
                <div class="AuthorInfo-name">${data.author?.name || '知乎用户'}</div>
                <div class="RichText">${data.content || ''}</div>
              </body>
            </html>
          `;
          return { html: mockHtml, status: 200 };
        }
      } else if (qidMatch) {
        // Fetch question answers list with dynamic limit and sort (votes/date)
        const questionId = qidMatch[1];
        const sortParam = zhihuSort === 'date' ? 'created' : 'default';
        const apiRes = await fetch(`https://api.zhihu.com/questions/${questionId}/answers?limit=${zhihuLimit}&sort_by=${sortParam}`, { headers });
        if (apiRes.ok) {
          const listData: any = await apiRes.json();
          const qTitle = listData.data?.[0]?.question?.title || '知乎问答';
          let bodyHtml = '';
          if (listData.data && Array.isArray(listData.data)) {
            listData.data.forEach((ans: any) => {
              bodyHtml += `
                <div class="answer-item">
                  <div class="AuthorInfo-name">${ans.author?.name || '知乎用户'}</div>
                  <div class="RichText">${ans.content || ''}</div>
                </div>
                <hr/>
              `;
            });
          }
          const mockHtml = `
            <html>
              <head>
                <title>${qTitle}</title>
              </head>
              <body>
                ${bodyHtml}
              </body>
            </html>
          `;
          return { html: mockHtml, status: 200 };
        }
      }
    } catch (apiErr) {
      console.error('[Herdown Worker] Zhihu API fallback failed:', apiErr);
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const isZhihu = targetUrl.includes('zhihu.com');
    const fetchRes = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
        ...(isZhihu ? {
          'referer': 'https://www.zhihu.com/',
          'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
          'sec-fetch-dest': 'document',
          'sec-fetch-mode': 'navigate',
          'sec-fetch-site': 'same-origin',
          'sec-fetch-user': '?1',
          'upgrade-insecure-requests': '1'
        } : (referer ? { 'referer': referer } : {})),
      },
    });

    clearTimeout(timer);

    if (!fetchRes.ok) {
      return { html: '', status: fetchRes.status };
    }

    const contentLength = fetchRes.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      throw new Error(`目标网页体积超出 10MB 安全解析上限`);
    }

    const text = await fetchRes.text();
    if (text.length > MAX_PAYLOAD_BYTES) {
      return { html: text.slice(0, MAX_PAYLOAD_BYTES), status: fetchRes.status };
    }

    return { html: text, status: fetchRes.status };
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('抓取目标网页响应超时 (超过 8 秒安全限制)');
    }
    throw err;
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-methods': 'GET, POST, OPTIONS, DELETE',
          'access-control-allow-headers': 'Content-Type, Authorization, Stripe-Signature',
        },
      });
    }

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
      
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          message: rateLimitResult.reason,
        }, { status: 429 });
      }

      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; zhihuLimit?: number; zhihuSort?: string };
      const targetUrl = (body.url || '').trim();
      const rawHtml = (body.html || '').trim();

      if (!targetUrl && !rawHtml) {
        return json({
          success: false,
          code: 'INVALID_INPUT',
          message: '请提供有效的 url 或 html 参数',
        }, { status: 400 });
      }

      if (targetUrl && isForbiddenUrl(targetUrl)) {
        return json({
          success: false,
          code: 'FORBIDDEN_TARGET',
          message: '安全防火墙已拦截该目标地址 (禁止内网/私有 IP 访问)',
        }, { status: 400 });
      }

      try {
        let sourceHtml = rawHtml;
        if (!sourceHtml && targetUrl) {
          const platform = detectPlatform(targetUrl);
          const referer = platform === 'xiaohongshu' ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/';

          const fetchResult = await safeFetchPageHtml(targetUrl, referer, 8000, body.zhihuLimit, body.zhihuSort);

          if (fetchResult.status !== 200 && fetchResult.status !== 0) {
            return json({
              success: false,
              code: 'PARSE_FAILED',
              message: `目标网页返回 HTTP 错误码 ${fetchResult.status}`,
            }, { status: 500 });
          }

          sourceHtml = fetchResult.html;
        }

        const result: ParseResult = parseMarkdown(sourceHtml, targetUrl);

        return json({
          success: true,
          title: result.title,
          markdown: result.markdown,
          frontmatter: result.frontmatter,
          images: result.images,
          platform: result.platform,
          account: result.account,
          author: result.author,
          published_at: result.publish_date,
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

    // Feature 1: Crawl Endpoint (Sitemap & Recursive Crawl) - POST /v1/crawl
    if (url.pathname === '/v1/crawl' && request.method === 'POST') {
      const authInfo = await verifyApiKeyOrIp(request, env);
      const rateLimitResult = await checkAndLogRateLimit(authInfo.keyOrIp, authInfo.isKey, env);
      if (!rateLimitResult.allowed) {
        return json({ success: false, message: rateLimitResult.reason }, { status: 429 });
      }

      const body = (await request.json().catch(() => ({}))) as { url?: string; limit?: number };
      const targetUrl = (body.url || '').trim();
      const limit = Math.min(20, Math.max(1, body.limit || 5));

      if (!targetUrl || isForbiddenUrl(targetUrl)) {
        return json({ success: false, message: '请传入有效的公网目标域名 URL' }, { status: 400 });
      }

      const startTime = Date.now();
      try {
        let sitemapUrl = targetUrl;
        if (!targetUrl.includes('sitemap')) {
          const origin = new URL(targetUrl).origin;
          sitemapUrl = `${origin}/sitemap.xml`;
        }

        const sitemapRes = await safeFetchPageHtml(sitemapUrl, undefined, 5000).catch(() => null);
        let content = sitemapRes?.html || '';
        
        if (!content) {
          const mainRes = await safeFetchPageHtml(targetUrl, undefined, 5000).catch(() => null);
          content = mainRes?.html || '';
        }

        const subUrls = extractSitemapUrls(content, targetUrl, limit);
        const crawlResults = await Promise.all(
          subUrls.map(async (u: string) => {
            const pageRes = await safeFetchPageHtml(u, undefined, 5000).catch(() => null);
            const html = pageRes?.html || '';
            const parsed = parseMarkdown(html, u);
            return {
              url: u,
              title: parsed.title,
              markdown: parsed.markdown,
              elapsed_ms: parsed.elapsed_ms,
            };
          })
        );

        // Deduct Quota for Crawled Subpages
        if (env.DB && crawlResults.length > 1) {
          const dateStr = new Date().toISOString().slice(0, 10);
          const dailyKey = `day:${authInfo.keyOrIp}:${dateStr}`;
          await env.DB.prepare(`
            UPDATE usage_logs SET count = count + ? WHERE key_or_ip = ? AND parse_date = ?
          `).bind(crawlResults.length - 1, dailyKey, dateStr).run().catch(() => null);
        }

        return json({
          success: true,
          domain: targetUrl,
          total_pages: crawlResults.length,
          results: crawlResults,
          elapsed_ms: Date.now() - startTime,
        });
      } catch (err: any) {
        return json({ success: false, message: err?.message || 'Crawl 失败' }, { status: 500 });
      }
    }

    // Feature 2: Screenshot API - POST /v1/screenshot
    if (url.pathname === '/v1/screenshot' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { url?: string };
      const targetUrl = (body.url || '').trim();

      if (!targetUrl || isForbiddenUrl(targetUrl)) {
        return json({ success: false, message: '请传入有效的 URL' }, { status: 400 });
      }

      return json({
        success: true,
        url: targetUrl,
        screenshot_url: `https://image.thum.io/get/width/1200/crop/800/${targetUrl}`,
        viewport: { width: 1200, height: 800 },
        format: 'png',
      });
    }

    // Feature 3: Vectorize RAG Chunks API - POST /v1/vectorize
    if (url.pathname === '/v1/vectorize' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string; chunk_size?: number };
      const targetUrl = (body.url || '').trim();
      const rawHtml = body.html || '';

      let sourceHtml = rawHtml;
      if (!sourceHtml && targetUrl) {
        const fetchRes = await safeFetchPageHtml(targetUrl, undefined, 5000).catch(() => null);
        if (fetchRes) {
          sourceHtml = fetchRes.html;
        }
      }

      if (sourceHtml.length > 10000) {
        sourceHtml = sourceHtml.slice(0, 10000);
      }

      const parsed = parseMarkdown(sourceHtml, targetUrl);
      const chunks = chunkMarkdownForRAG(parsed.markdown, body.chunk_size || 400);

      return json({
        success: true,
        title: parsed.title,
        total_chunks: chunks.length,
        notice: '单次向量切分限制最高 10,000 字，超长部分已自动截断以保障服务稳定',
        chunks,
      });
    }

    // Feature 4: Stripe Integration - POST /v1/checkout
    if (url.pathname === '/v1/checkout' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { plan?: string; key_name?: string };
      const plan = body.plan || 'pro';
      
      let checkoutUrl = 'https://buy.stripe.com/4gM14n18xc3c6SfaB43Ru0a';
      if (plan === 'team') {
        checkoutUrl = 'https://buy.stripe.com/00w6oHbNbebkgsP24y3Ru0b';
      } else if (plan === 'onetime') {
        checkoutUrl = 'https://buy.stripe.com/5kQ3cvcRf5EOa4r7oS3Ru09';
      }

      return json({
        success: true,
        plan,
        checkout_url: checkoutUrl,
        message: `正在为您跳转至 Stripe 官方收银台...`,
      });
    }

    // Stripe Webhook Endpoint: POST /v1/webhook/stripe
    if (url.pathname === '/v1/webhook/stripe' && request.method === 'POST') {
      const signature = request.headers.get('stripe-signature') || '';
      const bodyText = await request.text();

      // Simulate Stripe Webhook auto key provisioning
      const newKey = `sk_live_stripe_${Date.now().toString(36)}`;
      if (env.DB) {
        try {
          await env.DB.prepare('INSERT INTO api_keys (key, user_id, name, status) VALUES (?, ?, ?, ?)').bind(newKey, 'usr_stripe_paid', 'Stripe Paid Key', 'active').run();
        } catch {
          // ignore
        }
      }

      return json({ received: true, key: newKey });
    }

    // Dashboard API: API Key Management
    if (url.pathname === '/v1/keys') {
      if (request.method === 'GET') {
        if (!env.DB) return json({ keys: [] });
        try {
          const { results } = await env.DB.prepare('SELECT id, name, key, status, created_at FROM api_keys WHERE status != "revoked" ORDER BY created_at DESC').all();
          return json({ keys: results || [] });
        } catch {
          return json({ keys: [] });
        }
      }

      if (request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as { name?: string };
        const keyName = (body.name || 'API Key').trim();
        const newKey = `sk_live_free_${Math.random().toString(36).substring(2)}${Date.now().toString(36)}`;
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
        daily_quota: 20,
        quota_tier: "按凭证等级限制 (免费 20次/天, Pro 2,000次/天)",
        active_keys: totalKeys,
      });
    }

    // MCP Remote Endpoint (MCP 2026-07-28 Stateless Protocol Standard)
    if (url.pathname === '/mcp') {
      if (request.method === 'GET') {
        return json({
          name: 'herdown',
          serverName: 'Herdown MCP Server',
          protocol: 'mcp',
          protocolVersion: '2026-07-28',
          stateless: true,
          transport: 'http',
          endpoint: 'https://api.herdown.com/mcp',
          status: 'ready',
        });
      }

      if (request.method === 'POST') {
        const body = (await request.json().catch(() => null)) as {
          jsonrpc?: string;
          id?: string | number | null;
          method?: string;
          params?: Record<string, unknown>;
          _meta?: { protocolVersion?: string; clientCapabilities?: Record<string, unknown> };
        } | null;

        if (!body?.method) {
          return json({ jsonrpc: '2.0', id: body?.id ?? null, error: { code: -32600, message: 'Invalid Request' } }, { status: 400 });
        }

        // Support both initialization handshake and direct stateless call (MCP 2026-07-28)
        if (body.method === 'initialize') {
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              protocolVersion: body._meta?.protocolVersion || '2026-07-28',
              serverInfo: { name: 'Herdown MCP Server', version: '2.4.0' },
              capabilities: { tools: {}, stateless: true },
              _meta: { stateless: true },
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
                  name: 'crawl_website',
                  description: 'Crawl all internal pages or sitemap of a website into Markdown.',
                  inputSchema: {
                    type: 'object',
                    properties: {
                      url: { type: 'string', description: 'Domain URL or Sitemap XML link' },
                      limit: { type: 'number', description: 'Max pages to crawl (1-10)' },
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
          const args = (body.params?.arguments ?? {}) as { url?: string; html?: string; limit?: number };

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

    if (url.pathname === '/' || url.pathname === '/index.html') {
      const htmlContent = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MD for Agents (mdforagents.com) - 给 AI Agent 用的干净 Markdown 入口</title>
    <meta name="description" content="专为 AI Agent、开发者与自动化工作流打造的网页转 Markdown 工具链、REST API 与远程 MCP 平台。" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@400;500;600;700;800&family=Outfit:wght@600;700;800&display=swap" rel="stylesheet">
    <script type="module" crossorigin src="/assets/index-Cdc-Gcav.js?v=${Date.now()}"></script>
    <link rel="stylesheet" crossorigin href="/assets/index-Bh3JPuA3.css">
  </head>
  <body class="bg-[#090d10] text-[#e1e7ec] antialiased selection:bg-[#0f6b4f] selection:text-white">
    <div id="root"></div>
  </body>
</html>`;
      return new Response(htmlContent, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'cache-control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // Static Assets Fallback (Serves JS/CSS bundles)
    if (env.ASSETS) {
      try {
        return await env.ASSETS.fetch(request);
      } catch {
        // Fallback
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};
