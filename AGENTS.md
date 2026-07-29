# Herdown — 项目级 AI 编码指南

## 项目基本信息

- **项目路径**：`/Volumes/Samsung T7/antigravity/herdown`
- **API 部署地址**：`api.herdown.com`（Cloudflare Worker）
- **GitHub**：`https://github.com/less1001/herdown`
- **核心解析文件**：`packages/core/src/parser.ts`
- **npm 包组织**：`@herdown/cli` / `@herdown/core` / `@herdown/mcp` / `@herdown/sdk`（账号 vkdefi，token 到期 2026-10-25）

## 核心工作规范（用户铁律）

1. **自我校验铁律 (Self-Verification)**：生成 Markdown 后，**必须先用 `view_file` 检查生成文件的完整性**（核对段落末尾是否截断、是否误带 JSON 代码、格式是否全量），自检 100% 无误后方可保存到 Obsidian 并通知用户。
2. **Obsidian 预览验证**：**每个平台测试转换完成后，必须将生成的 Markdown 保存到用户的 Obsidian Vault 中，在 Obsidian 中打开给用户手动验证**，未经用户验证绝不出具完成报告。
3. **知识沉淀**：把每个平台的 HTML 选择器、防盗链策略、LaTeX 处理与坑点实时记录到本 `AGENTS.md`。

## 部署流程

1. 修改 `packages/core/src/parser.ts`
2. `pnpm build`（在项目根目录）
3. `npx wrangler deploy --cwd apps/worker`（部署至 api.herdown.com）
4. CLI 发布：`cd packages/cli && pnpm build && pnpm publish --no-git-checks --access public`（发布为 `@herdown/cli`）
5. npm token 续期：Granular token，勾选 Bypass 2FA + Read and write + All packages

---

## 图片防盗链处理规律（已验证）

| 平台 | CDN域名 | 防盗链策略 | 解决方案 |
|------|---------|-----------|---------|
| 微信公众号 | qpic.cn | 无 Referer 可加载；带外部 Referer 403 | `<img referrerpolicy="no-referrer">` |
| 小红书 | xhscdn.com | 同微信，外部 Referer 被拒 | `<img referrerpolicy="no-referrer">` |
| 少数派 | cdnfile.sspai.com | **必须带 `Referer: https://sspai.com/`** | CLI 下载图片到本地 |
| 知乎 | pic*.zhimg.com | 同微信策略 | `<img referrerpolicy="no-referrer">` |
| 维基百科 | upload.wikimedia.org | 无防盗链，开放访问 | 标准 `![](url)` markdown |

**判断方法**：`curl -sI "<图片URL>"` 看状态码；再加 `-H "Referer: https://<该平台域名>/"` 对比。
- 无 Referer → 200：开放，用标准 markdown
- 无 Referer → 403，加平台 Referer → 200：需 CLI 本地下载
- 无 Referer → 403，去掉 Referer → 200：用 `referrerpolicy="no-referrer"`

---

## 各平台 HTML 结构关键选择器（已验证）

### 微信公众号（mp.weixin.qq.com）

*平台检测*：
- URL 含 `mp.weixin.qq.com` 优先；兜底检测 HTML 中含 `js_content` 或 `mp.weixin.qq.com`

*标题提取优先级*（依次尝试）：
1. `var msg_title = "..."` JS 变量（最可靠）
2. `<h1 class="activity-name">` DOM 元素
3. `<meta property="og:title">` 标签
4. `<title>` 标签，但过滤掉含「微信公众号」的结果

*正文提取*：
- 起点：`id="js_content"` div 的**结束位置**（取 div 开始标签末尾 `>` 之后）
- 终点（取最早出现的）：`rich_media_area_extra` / `js_to_share_div` / `js_content_bottom_area` / `js_bottom_ad_area` / `js_profile_qrcode` / `js_cmt_area`
- 注意：终点要回退到 `<` 位置（用 `lastIndexOf('<', endPos)`），避免截断 HTML 标签
- 降级方案：`js_content` 内容 < 50 字符时，改从 `content_noencode : "..."` JS 变量中提取，需处理 `\x3c` `\x3e` `\x22` 转义

*图片提取*（**关键坑**）：
- 微信正文图片使用**懒加载**：真实 URL 在 `data-src` 属性，`src` 只是占位符 → **必须读 `data-src`，不能读 `src`**
- 相册文章：图片在 `picture_page_info_list = [...]` JS 数组中；从数组的每个 `cdn_url: "..."` 取值
  - 需先清除 `watermark_info` 和 `share_cover` 字段再提取，避免水印/封面 URL 混进来
- 去重：同 URL 不重复添加；过滤 `qrcode` URL
- 显示：`<img src="..." referrerpolicy="no-referrer">` — qpic.cn 外部 Referer 返回 403，no-referrer 可正常访问

*元数据提取*：
- **公众号名（account）**：`var nickname = "..."` JS 变量；或 `class="rich_media_meta_nickname"` → `<a>` 标签文本
- **作者（author）**：`var author = "..."` 或 `var msg_author = "..."` JS 变量；或 `class="rich_media_meta_text"` → `<span>` 文本
- **发布时间**：`var ct = "..."` Unix 时间戳（10位数字）→ `new Date(ct * 1000).toISOString().split('T')[0]`；或 `id="publish_time"` → `<em>` 文本

### 知乎（zhuanlan.zhihu.com / zhihu.com/question/...）

*平台检测*：
- URL 匹配 `zhuanlan.zhihu.com` 或 `zhihu.com/question/` 或 `zhihu.com/p/`

*反爬网络规律 (2026 最新)*：
- **`zse-ck` 挑战**：直接无 Cookie 请求 `zhuanlan.zhihu.com` 会触发知乎 `zse-ck` JS 盾牌网页。
- **解决方案**：
  1. 支持用户直接粘贴 HTML 源码转换（前端控制台零障碍）。
  2. 请求时构造 `d_c0` 设备 Token 与桌面 Chrome User-Agent 标头。

*正文与 LaTeX 公式提取*：
- **正文定位**：优先匹配 `class="Post-RichText"`（专栏文章）或 `class="RichText"`（回答内容）。
- **LaTeX 公式**：知乎使用 `<span class="ztext-math" data-tex="...">` 存储公式源码。解析时提取 `data-tex` 属性并转换为标准的 `$ ... $` 行内公式和 `$$ ... $$` 块级公式。
- **图片**：提取 `data-actualsrc` 或 `src`，主图片源为 `pic*.zhimg.com`，防盗链采用 `<img referrerpolicy="no-referrer">` 正常渲染。

---

### 小红书（xiaohongshu.com / xhslink.cn 短链）

*平台检测*（**关键坑：不能只靠 URL**）：
- URL 含 `xiaohongshu.com` / `xhslink.com` / `xhslink.cn`
- HTML fingerprinting 兜底：检测 `xhscdn.com` 或 `xiaohongshu` 或 `__INITIAL_STATE__` + `imageList` 组合
- 原因：xhslink.cn 短链 302 跳转后实际落地页 URL 可能不含「小红书」字样

*架构*：Vue SPA，**服务端不渲染正文**，内容全部在 `window.__INITIAL_STATE__` JSON 字符串中

*图片提取*（**多个关键坑**）：
- **优先**：`"imageScene":"H5_DTL","url":"..."` 模式 — H5_DTL = 高清原图
  - JSON 中斜杠 `/` 可能被 Unicode 转义为 `\u002F`，需 `decodeUnicode()` 处理后再用
- **降级**：从 `sns-webpic-qc.xhscdn.com` 或 `sns-na-i{n}.xhscdn.com` CDN URL 中提取
- **避免**：`nd_prv` = 低清预览图，有对应 `nd_dft` 高清版时必须过滤掉
- **去重关键坑**：不能用 URL 字符串做唯一键！xhscdn CDN 哈希对同一张图每次请求不同
  - 正确做法：用 `notes_pre_post/{noteId}` 中的 noteId 做唯一键
  - 当 `nd_prv_` 和 `nd_dft_` 共享同一 noteId，只保留 `nd_dft_`（高清）
- 过滤 `avatar` 图片（头像）
- 显示：`<img referrerpolicy="no-referrer">` — xhscdn.com 同微信策略，外部 Referer 被拒

*正文文字提取*：
- `"desc":"..."` JSON 字段；可能有多个 match，取**最长的**（最可能是笔记正文）
- 处理转义序列：`\n\t` → `\n`，`\n` → `\n`，`\t` → 空格
- emoji 替换：`[买爆R]` → 🛍️，`[赞R]` → 👍（小红书特有格式）
- 降级：`<meta name="description">` 或 `og:description`

*标题提取*：`"title":"..."` JSON 字段，取长度>5 且不含反斜杠的第一个匹配

*作者*：`"nickname":"..."` 第一个匹配；account = author（XHS 没有「公众号名」和「作者名」之分）

---

### 少数派（sspai.com）

*架构*：Nuxt/Vue SSR，内容在 HTML 中直接渲染

*正文提取*：
- 找到 `class="article-body"` 的位置
- 在该区域内找到第一个 `<p>`/`<h2>`/`<blockquote>` 等标签作为正文起点（跳过 benefits 付费提示等 div 垃圾）
- 终止于 `class="article__footer"` 出现位置

*图片提取*：
- `<figure class="image ss-img-wrapper"><img src="..." data-original="...">` 结构
- 优先用 `data-original`（无 CDN 处理参数的原图 URL）
- 图片防盗链：cdnfile.sspai.com 需 `Referer: https://sspai.com/`，Obsidian 无法动态设置，**必须 CLI 本地下载到 attachments/ 目录**

*元数据*：
- **作者**：`class="ss__user__card__nickname"` → 文本内容
- **发布日期**：`class="article__header__date"` → 格式「2026年07月28日」→ 用正则转为「2026-07-28」

---

### 36氪（36kr.com）

*架构*：Next.js / React SSR，正文在 HTML 和 `window.initialState` JSON 中兼备

*正文提取与页脚剥离*：
- **正文起点**：匹配 `class="articleDetailContent"` 或 `class="kr-rich-text-wrapper"`。
- **页脚防污染切片**：终止于 `class="article-footer"` 或 `class="common-content-footer"` 或 `需要你的鼓励` 标志，防止卷入底部的评论区、关注组件、推荐文章等垃圾 Div。

*图片提取*：
- `img.36krcdn.com` 域名，图片加 `referrerpolicy="no-referrer"` 渲染防盗链。

*元数据*：
- **作者**：`"author":"..."` 或 `"userNick":"..."`
- **发布时间**：`"publishTime": Timestamp` → `new Date(ts).toISOString().split('T')[0]`

---

## 通用提取经验

**内容区域定位优先级**：
1. 有精确 ID（`id="article-content"` / `id="js_content"`）→ 直接用
2. 有语义类名（`class="article-body"` / `class="article__content"`）→ 找到后从第一个 `<p>` 开始
3. SPA 网站（Vue/React 无 SSR）→ 解析 `__INITIAL_STATE__` 或 `__NUXT_DATA__` JSON
4. 兜底：`<article>` 标签或 `<main>` 标签

**元数据提取优先级**：
1. Open Graph meta 标签（`og:title`, `og:author`, `article:published_time`）— 最通用
2. JSON-LD / Schema.org（`<script type="application/ld+json">`）— 结构化数据
3. 平台特定 DOM 选择器（需针对每个平台单独分析）

**通用排版与抗坑四大铁律**：
1. **空行保护铁律 (Paragraph Spacing)**：禁止过度使用 `.filter(line => line.trim())` 过滤空行！必须采用 `.replace(/\n{3,}/g, '\n\n')` 策略，严格保留 Markdown 标准段落双空行（`\n\n`）。
2. **API 分段/分页拼接 (Segment Stitching)**：现代 SPA / API 接口中的 `content` 经常带 `content_need_truncated: true`（被系统人为截断 80%），必须优先检查并遍历 `segment_infos` 数组，将 `text` 字段按顺序 `\n\n` 拼接，保证全量无截断。
3. **语义化文章标题命名 (Title Naming)**：导出 Markdown 文件名严禁使用 `zhihu-12345` 类似冷冰冰的数字 ID，必须清洗文章标题作为文件名（格式如：`文章标题 - 作者的回答.md`），确保 Obsidian 侧边栏一眼可见。
4. **交付前自我校验 (Pre-Delivery Self-Verification)**：生成文件后， Agent 必须先用 `view_file` 亲自检查全文完整性（核对末尾句是否截断、是否误带 JSON/代码杂质、段落空行是否舒适），自检 100% 通过后才可交由用户验证。

**Markdown 输出与标准化规范 (Defuddle + Crawl4AI + Firecrawl 引擎)**：
- 所有平台统一输出 YAML frontmatter（source_url, title, account, author, published_at, saved_at, platform, parse_status）
- **Defuddle 规则**：
  - 提示框标准化：识别 GitHub Alert、Obsidian Callout、Bootstrap Alert 自动转为 Obsidian `> [!note]` / `> [!warning]`
  - 标题去重与降级：自动剔除正文开头与 Title 重复的主标题；正文 `<h1>` 统一降级为 `##` (H2)
  - 代码块高亮：保留编程语言标注（如 ` ```typescript `），清除 `<span class="line-number">` 等无用行号
- **Firecrawl 规则**：
  - 图注保留：解析 `<figure><figcaption>` 结构，转换为 `![图注](url)` + `*图注*` 语义标注
  - Alt 智能补充：非空 alt 保护，缺失时根据平台 context 自动填充语义
- **Crawl4AI 规则**：
  - 尾注模式：支持转换内联超链接为 `[1]`, `[2]` 并自动生成尾部 `## References` 列表
- 数学公式（知乎等）：保留 `$...$` 行内和 `$$...$$` 块级格式
- 表格：HTML `<table>` 转 Markdown 表格格式
