# Herdown — 项目级 AI 编码指南

## 项目基本信息

- **项目路径**：`/Volumes/Samsung T7/antigravity/herdown`
- **API 部署地址**：`api.herdown.com`（Cloudflare Worker）
- **GitHub**：`https://github.com/less1001/herdown`
- **核心解析文件**：`packages/core/src/parser.ts`
- **npm 包组织**：`@herdown/cli` / `@herdown/core` / `@herdown/mcp` / `@herdown/sdk`（账号 vkdefi，token 到期 2026-10-25）

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

**Markdown 输出规范**：
- 所有平台统一输出 YAML frontmatter（source_url, title, account, author, published_at, saved_at, platform, parse_status）
- 图片：防盗链平台用 `<img referrerpolicy="no-referrer" src="...">` 或本地下载；开放平台用 `![](url)`
- 加粗/斜体/代码块：通过 `htmlToMarkdownFast` 函数统一处理，保留 `<strong>`, `<em>`, `<code>` 转换
- 数学公式（知乎等）：保留 `$...$` 行内和 `$$...$$` 块级格式
- 表格：HTML `<table>` 转 Markdown 表格格式
