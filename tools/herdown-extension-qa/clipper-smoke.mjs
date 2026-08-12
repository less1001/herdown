import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const popupSource = await readFile(new URL('../../apps/extension/popup.js', import.meta.url), 'utf8');
const contentSource = await readFile(new URL('../../apps/extension/content.js', import.meta.url), 'utf8');
const formatterSource = popupSource.slice(popupSource.indexOf('function buildFrontmatter'), popupSource.indexOf('async function copyMarkdown'));
const createContext = () => {
  const document = {
    addEventListener() {},
    getElementById() { return { value: '', textContent: '', style: {}, classList: { toggle() {} }, addEventListener() {} }; }
  };
  const context = {
    console,
    document,
    navigator: { language: 'zh-CN' },
    chrome: {},
    URL,
    URLSearchParams,
    Blob,
    Node: { TEXT_NODE: 3, ELEMENT_NODE: 1 },
    setTimeout() {},
    clearTimeout() {},
  };
  vm.createContext(context);
  vm.runInContext(formatterSource, context);
  return context;
};

const context = createContext();
const wechatSource = await readFile(new URL('./fixtures/wechat-article.html', import.meta.url), 'utf8');
const genericSource = await readFile(new URL('./fixtures/article.html', import.meta.url), 'utf8');

// The formatter is exercised with a tiny DOM shim to test its format guarantees.
const plusCleaned = context.cleanInline('发掘+web+产品需求', true);
assert.equal(plusCleaned, '发掘+web+产品需求');
assert.equal(context.cleanInline('垂直行业 + 明确金钱损失 + AI自动执行 + 订阅', true), '垂直行业 + 明确金钱损失 + AI自动执行 + 订阅');
assert.equal(context.cleanInline('a+b 与 C++', true), 'a+b 与 C++');
assert.equal(context.cleanInline('看+Similarweb+(https://www.similarweb.com/)', true), '看+Similarweb+(https://www.similarweb.com/)');
assert.equal(context.cleanupMarkdown('alpha\n\n\n\n beta', false), 'alpha\n\nbeta');
assert.equal(context.cleanupMarkdown('[链接](https://example.com/a+b)', true), '[链接](https://example.com/a+b)');
assert.equal(context.removeLeadingTitle('# 测试标题\n\n正文', '测试标题', false), '正文');
assert.equal(context.removeLeadingTitle('[分类](https://example.com)\n\n# 测试标题\n\n正文', '测试标题', false), '[分类](https://example.com)\n\n正文');
assert.equal(context.removeLeadingTitle('# 保留标题\n\n正文', '另一个标题', false), '# 保留标题\n\n正文');
const wechatFrontmatter = context.buildFrontmatter({ title: '测试标题', url: 'https://mp.weixin.qq.com/s/test', author: '我是哥飞', publisher: '哥飞', published: '2023-07-25', description: '描述' });
assert.match(wechatFrontmatter, /author: "我是哥飞"\npublisher: "哥飞"/);
assert.match(wechatFrontmatter, /tags:\n  - clippings\n  - herdown/);
assert.doesNotMatch(context.buildFrontmatter({ title: '测试', url: 'https://example.com' }), /source_url|domain|:\+|\+{2,}/);
assert.match(contentSource, /document\.querySelector\('#js_author_name'\)/);
assert.match(contentSource, /document\.querySelector\('#js_name, \.rich_media_meta_nickname'\)/);
assert.match(wechatSource, /data-src=/);
assert.match(genericSource, /class="advertisement"/);
console.log('Herdown clipper formatter smoke checks passed');
