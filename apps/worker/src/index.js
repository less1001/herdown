import { parseMarkdown } from '@herdown/core';
const json = (data, init = {}) => new Response(JSON.stringify(data, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
    ...init,
});
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname === '/health') {
            return json({ ok: true, app: env.APP_NAME });
        }
        if (url.pathname === '/v1/parse' && request.method === 'POST') {
            const body = (await request.json().catch(() => ({})));
            const targetUrl = typeof body.url === 'string' ? body.url : '';
            const sourceHtml = typeof body.html === 'string' ? body.html : (targetUrl ? await fetch(targetUrl, {
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
        if (url.pathname === '/mcp') {
            return json({
                protocol: 'mcp',
                status: 'ready',
                tools: ['parse', 'normalize', 'health'],
            });
        }
        return new Response('Not Found', { status: 404 });
    },
};
