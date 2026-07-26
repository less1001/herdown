import { parseMarkdown } from '../../../packages/core/dist/index.js';

export interface Env {
  DB: D1Database;
  APP_NAME: string;
}

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ ok: true, app: env.APP_NAME });
    }

    if (url.pathname === '/v1/parse' && request.method === 'POST') {
      const body = (await request.json().catch(() => ({}))) as { url?: string; html?: string };
      const targetUrl: string = typeof body.url === 'string' ? body.url : '';
      const sourceHtml: string = typeof body.html === 'string' ? body.html : (targetUrl ? await fetch(targetUrl, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          referer: targetUrl.includes('xiaohongshu.com') ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/',
        },
      }).then((res) => res.text()) : '');
      const result = parseMarkdown(sourceHtml, targetUrl);
      return json({
        title: result.title,
        markdown: result.markdown,
        images: result.images,
      });
    }

    if (url.pathname === '/mcp' && request.method === 'GET') {
      return json({
        protocol: 'mcp',
        transport: 'http',
        status: 'ready',
        endpoint: '/mcp',
      });
    }

    if (url.pathname === '/mcp' && request.method === 'POST') {
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
            serverInfo: { name: env.APP_NAME, version: '0.1.0' },
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
                name: 'parse',
                description: 'Parse a public page into Markdown.',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    html: { type: 'string' },
                  },
                },
              },
              {
                name: 'health',
                description: 'Return service health status.',
                inputSchema: { type: 'object', properties: {} },
              },
            ],
          },
        });
      }

      if (body.method === 'tools/call') {
        const name = String(body.params?.name ?? '');
        const args = (body.params?.arguments ?? {}) as { url?: string; html?: string };

        if (name === 'health') {
          return json({ jsonrpc: '2.0', id: body.id ?? null, result: { content: [{ type: 'text', text: 'ok' }] } });
        }

        if (name === 'parse') {
          const targetUrl: string = typeof args.url === 'string' ? args.url : '';
          const sourceHtml: string = typeof args.html === 'string' ? args.html : (targetUrl ? await fetch(targetUrl, {
            headers: {
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              referer: targetUrl.includes('xiaohongshu.com') ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/',
            },
          }).then((res) => res.text()) : '');
          const result = parseMarkdown(sourceHtml, targetUrl);
          return json({
            jsonrpc: '2.0',
            id: body.id ?? null,
            result: {
              content: [{ type: 'text', text: result.markdown }],
              structuredContent: result,
            },
          });
        }
      }

      return json({ jsonrpc: '2.0', id: body.id ?? null, error: { code: -32601, message: 'Method not found' } }, { status: 404 });
    }

    return new Response('Not Found', { status: 404 });
  },
};
