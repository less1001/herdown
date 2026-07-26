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

const home = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MD for Agents - 网页转Markdown</title>
    <style>
      :root {
        color-scheme: light;
        --paper: #f6f1e7;
        --ink: #17221c;
        --muted: #5e6a60;
        --line: #d9cdb7;
        --panel: rgba(255, 251, 242, 0.88);
        --green: #0f6b4f;
        --green-deep: #0a3f32;
        --gold: #d69a2d;
        --coal: #111712;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "Avenir Next", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
        background:
          radial-gradient(circle at 12% 10%, rgba(214, 154, 45, 0.26), transparent 28%),
          radial-gradient(circle at 90% 4%, rgba(15, 107, 79, 0.2), transparent 32%),
          linear-gradient(135deg, #fbf7ee 0%, var(--paper) 42%, #ebe0ce 100%);
        color: var(--ink);
      }
      body::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        opacity: 0.32;
        background-image:
          linear-gradient(rgba(23, 34, 28, 0.05) 1px, transparent 1px),
          linear-gradient(90deg, rgba(23, 34, 28, 0.05) 1px, transparent 1px);
        background-size: 38px 38px;
      }
      .shell {
        width: min(1180px, calc(100vw - 32px));
        margin: 0 auto;
        padding: 30px 0 44px;
        position: relative;
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        margin-bottom: 54px;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 22px;
        font-weight: 800;
        letter-spacing: -0.04em;
      }
      .mark {
        width: 42px;
        height: 42px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        color: #fffaf0;
        background: var(--green-deep);
        box-shadow: 8px 8px 0 rgba(214, 154, 45, 0.55);
      }
      nav {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      nav a, .links a {
        border: 1px solid var(--line);
        color: var(--ink);
        text-decoration: none;
        background: rgba(255, 255, 255, 0.45);
      }
      nav a {
        border-radius: 999px;
        font-size: 14px;
        padding: 9px 14px;
      }
      .hero {
        display: grid;
        grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
        gap: 28px;
        align-items: stretch;
      }
      .copy, .tool {
        border: 1px solid var(--line);
        border-radius: 34px;
        background: var(--panel);
        backdrop-filter: blur(18px);
        box-shadow: 0 26px 80px rgba(46, 35, 18, 0.16);
      }
      .copy {
        min-height: 560px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: clamp(28px, 5vw, 52px);
      }
      .eyebrow {
        display: inline-flex;
        width: fit-content;
        align-items: center;
        border: 1px solid rgba(15, 107, 79, 0.22);
        border-radius: 999px;
        color: var(--green-deep);
        background: rgba(15, 107, 79, 0.08);
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 700;
      }
      h1 {
        margin: 26px 0 18px;
        font-family: Georgia, "Songti SC", serif;
        font-size: clamp(46px, 7vw, 88px);
        line-height: 0.94;
        letter-spacing: -0.07em;
      }
      p {
        margin: 0;
        color: var(--muted);
        font-size: 18px;
        line-height: 1.85;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-top: 34px;
      }
      .stat {
        border-top: 1px solid var(--line);
        padding-top: 16px;
      }
      .stat b {
        display: block;
        font-size: 24px;
        letter-spacing: -0.04em;
      }
      .stat span {
        display: block;
        color: var(--muted);
        font-size: 13px;
        margin-top: 4px;
      }
      .tool { overflow: hidden; }
      .tool-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 24px 24px 18px;
        border-bottom: 1px solid var(--line);
        background: rgba(255, 255, 255, 0.38);
      }
      .tool-head h2 {
        margin: 0;
        font-size: 20px;
        letter-spacing: -0.04em;
      }
      .pill {
        border-radius: 999px;
        background: #e8f4ef;
        color: var(--green-deep);
        padding: 7px 10px;
        font-size: 12px;
        font-weight: 800;
      }
      form {
        display: grid;
        gap: 14px;
        padding: 24px;
      }
      label {
        display: grid;
        gap: 8px;
        color: var(--coal);
        font-size: 13px;
        font-weight: 800;
      }
      input, textarea {
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: rgba(255, 255, 255, 0.76);
        color: var(--ink);
        font: inherit;
        outline: none;
        padding: 14px 16px;
      }
      textarea {
        min-height: 132px;
        resize: vertical;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 13px;
        line-height: 1.6;
      }
      input:focus, textarea:focus {
        border-color: var(--green);
        box-shadow: 0 0 0 4px rgba(15, 107, 79, 0.12);
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      button {
        border: 0;
        border-radius: 16px;
        cursor: pointer;
        font-weight: 900;
        padding: 13px 16px;
        color: #fffaf0;
        background: var(--green-deep);
      }
      button.secondary {
        color: var(--green-deep);
        background: rgba(15, 107, 79, 0.1);
      }
      button:disabled {
        cursor: wait;
        opacity: 0.72;
      }
      .result {
        margin: 0 24px 24px;
        border: 1px solid var(--line);
        border-radius: 22px;
        overflow: hidden;
        background: #111712;
      }
      .result-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        color: #dfeadd;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 13px;
      }
      #output {
        min-height: 214px;
        margin: 0;
        padding: 16px;
        color: #d7f7e9;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: "SFMono-Regular", Consolas, monospace;
        font-size: 13px;
        line-height: 1.65;
      }
      .links {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        padding: 0 24px 24px;
      }
      .links a {
        border-radius: 16px;
        color: var(--green-deep);
        padding: 13px;
        font-size: 13px;
        font-weight: 800;
      }
      .toast {
        min-height: 20px;
        color: var(--muted);
        font-size: 13px;
      }
      @media (max-width: 900px) {
        .hero { grid-template-columns: 1fr; }
        .copy { min-height: auto; }
      }
      @media (max-width: 620px) {
        .shell { width: min(100% - 22px, 1180px); padding-top: 18px; }
        header { align-items: flex-start; margin-bottom: 24px; }
        nav { justify-content: flex-start; }
        .stats, .links { grid-template-columns: 1fr; }
        .tool-head { align-items: flex-start; flex-direction: column; }
      }
    </style>
  </head>
  <body>
    <div class="shell">
      <header>
        <div class="brand"><span class="mark">MD</span><span>MD for Agents</span></div>
        <nav>
          <a href="/health">服务状态</a>
          <a href="/mcp">MCP端点</a>
          <a href="https://github.com/less1001/mdforagents">GitHub</a>
        </nav>
      </header>

      <main class="hero">
        <section class="copy">
          <div>
            <span class="eyebrow">网页内容清洗与Markdown结构化</span>
            <h1>给AI Agent用的干净Markdown入口</h1>
            <p>把公开网页、微信文章、小红书页面转换成更适合RAG、知识库、自动化工作流读取的Markdown。网站、REST API、远程MCP端点统一部署在Cloudflare Workers上。</p>
          </div>
          <div class="stats" aria-label="产品能力">
            <div class="stat"><b>API</b><span>POST /v1/parse</span></div>
            <div class="stat"><b>MCP</b><span>远程工具端点</span></div>
            <div class="stat"><b>D1</b><span>Cloudflare全栈</span></div>
          </div>
        </section>

        <section class="tool" aria-label="Markdown转换工具">
          <div class="tool-head">
            <h2>在线转换</h2>
            <span class="pill">可直接商用演示</span>
          </div>
          <form id="parse-form">
            <label>
              网页URL
              <input id="url" name="url" type="url" placeholder="https://mp.weixin.qq.com/s/..." />
            </label>
            <label>
              或粘贴HTML
              <textarea id="html" name="html" placeholder="也可以直接粘贴网页HTML源码，系统会优先解析这段HTML。"></textarea>
            </label>
            <div class="actions">
              <button id="submit" type="submit">转换为Markdown</button>
              <button class="secondary" id="copy" type="button">复制结果</button>
            </div>
            <div class="toast" id="status">输入URL或HTML后开始转换。</div>
          </form>
          <div class="result">
            <div class="result-bar"><span>Markdown结果</span><span id="meta">等待输入</span></div>
            <pre id="output">转换完成后，Markdown会显示在这里。</pre>
          </div>
          <div class="links">
            <a href="/health">检查Health</a>
            <a href="/mcp">查看MCP</a>
            <a href="https://github.com/less1001/mdforagents">查看源码</a>
          </div>
        </section>
      </main>
    </div>

    <script>
      const form = document.querySelector("#parse-form");
      const submit = document.querySelector("#submit");
      const copy = document.querySelector("#copy");
      const statusNode = document.querySelector("#status");
      const output = document.querySelector("#output");
      const meta = document.querySelector("#meta");

      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const url = document.querySelector("#url").value.trim();
        const html = document.querySelector("#html").value.trim();
        if (!url && !html) {
          statusNode.textContent = "请先输入URL或粘贴HTML。";
          return;
        }

        submit.disabled = true;
        statusNode.textContent = "正在解析，请稍等...";
        meta.textContent = "处理中";

        try {
          const response = await fetch("/v1/parse", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ url, html })
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data && data.message ? data.message : "解析失败");

          output.textContent = data.markdown || "# " + (data.title || "Untitled");
          meta.textContent = (data.images ? data.images.length : 0) + "张图片";
          statusNode.textContent = "转换完成，可以复制Markdown。";
        } catch (error) {
          output.textContent = "";
          meta.textContent = "失败";
          statusNode.textContent = error instanceof Error ? error.message : "解析失败，请稍后重试。";
        } finally {
          submit.disabled = false;
        }
      });

      copy.addEventListener("click", async () => {
        await navigator.clipboard.writeText(output.textContent || "");
        statusNode.textContent = "已复制到剪贴板。";
      });
    </script>
  </body>
</html>`;

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

    if (url.pathname === '/') {
      return new Response(home, {
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    }

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
