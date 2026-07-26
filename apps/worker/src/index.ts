export interface Env {
  DB: D1Database;
  APP_NAME: string;
}

type ParseResult = {
  title: string;
  markdown: string;
  images: string[];
};

const json = (data: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(data, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
  });

const normalizeSpaces = (value: string) => value.replace(/[\t\r]+/g, ' ').replace(/\u00a0/g, ' ');

const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const extractTitle = (html: string, fallbackUrl: string) => {
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch?.[1]) return normalizeSpaces(titleMatch[1]).trim();
  return fallbackUrl || 'Untitled';
};

const extractPictureArticleImages = (html: string): string[] => {
  const images: string[] = [];
  const listMatch = /picture_page_info_list\s*=\s*(\[[\s\S]*?\])\s*;/i.exec(html)
    || /picture_page_info_list\s*:\s*(\[[\s\S]*?\])\s*,/i.exec(html);

  if (!listMatch) return images;

  const listBlock = listMatch[1]
    .replace(/watermark_info\s*:\s*\{[\s\S]*?\}/gi, '')
    .replace(/share_cover\s*:\s*\{[\s\S]*?\}/gi, '');

  const cdnRegex = /cdn_url\s*:\s*["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = cdnRegex.exec(listBlock)) !== null) {
    const cleanUrl = match[1].replace(/\\/g, '').replace(/&amp;/g, '&');
    if (cleanUrl.startsWith('http') && !images.includes(cleanUrl)) {
      images.push(cleanUrl);
    }
  }

  return images;
};

const extractWeChatContent = (html: string) => {
  const start = html.indexOf('<div id="js_content"');
  if (start >= 0) {
    const next = html.indexOf('<script', start);
    if (next > start) {
      return html.slice(start, next);
    }
  }

  const fallback = /content_noencode\s*:\s*(["'])([\s\S]*?)\1\s*,/i.exec(html);
  if (fallback?.[2]) {
    return decodeEntities(fallback[2].replace(/\\x3c/g, '<').replace(/\\x3e/g, '>'));
  }

  return html;
};

function parseMarkdown(html: string, fallbackUrl = ''): ParseResult {
  const compact = normalizeSpaces(html);
  const title = extractTitle(compact, fallbackUrl);
  const contentHtml = extractWeChatContent(compact);
  const images = extractPictureArticleImages(contentHtml);

  const body = Array.from(contentHtml.matchAll(/<(p|h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi))
    .map((match) => match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n')
    .trim();

  const markdown = body.length > 0
    ? `${body}${images.length ? `\n\n${images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n')}` : ''}`
    : images.map((url, index) => `![图片 ${index + 1}](${url})`).join('\n\n');

  return { title, markdown, images };
}

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
      return json({ title: result.title, markdown: result.markdown, images: result.images });
    }

    if (url.pathname === '/mcp' && request.method === 'GET') {
      return json({ protocol: 'mcp', transport: 'http', status: 'ready', endpoint: '/mcp' });
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
