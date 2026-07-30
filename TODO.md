# 📋 Herdown 5大核心功能开发与测试待办清单

---

## 🛠️ 第一部分：5 大核心组件可用性自检 (当前最高优先级)

### 1. 【单页转换】与【REST API】
- [x] **匿名限额调整**：已将单页转换的游客限制放宽至 **5次/分钟**、**20次/天**（付费账号放宽至 20次/分、100次/天）。
- [x] **突破知乎 403 阻断 (PC端 + 大数溢出)**：
  - [x] 限制知乎 ID 为 `string` 彻底杜绝 JavaScript 19 位大数溢出截断错误；
  - [x] 注入全套 PC Chrome 顶级 headers 拟真指纹。
- [ ] **微信与通用网页连通性 E2E 测试**：
  - 待用户在 `herdown.com` 网页端重新验证知乎/微信等单页转换是否 100% 通顺无 403。

### 2. 【全站 Sitemap 递归 Crawl】
- [x] **JSZip 依赖集成**：在前端项目包中引入并配置了 JSZip 打包库。
- [x] **一键压缩包下载 UI**：在爬取结果头部增加了 `💾 一键打包下载全站 Markdown (.zip)` 按钮，且已连通生成 Blob 下载逻辑。
- [ ] **递归抗阻断测试**：使用一个真实的 docs 文档站 Sitemap 对并发爬取和 ZIP 导出排版进行一次实测。

### 3. 【MCP 服务端 (Model Context Protocol)】
- [ ] **Cursor / Claude Desktop 连通性测试**：
  - 验证本地 MCP 服务的配置入口，确保 Cursor 可以稳定调用 `herdown` 作为内置的 RAG 获取工具。

### 4. 【CLI 终端工具】
- [ ] **无头浏览器渲染 (Headless) 或本地桥接**：
  - 目前 CLI 抓取动态 JS 页面（如即刻）会拿到空 HTML，需要决定是引入轻量 headless 引擎，还是利用本地端口桥接浏览器插件。

---

## 20-Platform 热门平台专项适配与清洗测试

- [x] **已攻克平台 (1-6)**：微信公众号、小红书、少数派 (sspai)、知乎、36氪、即刻 (okjike.com)
- [ ] **待测试与去噪净化平台 (7-20)**（建议通过网页转换或插件转换）：
  - [ ] **掘金 (`juejin.cn`)**：验证技术代码块保留与侧边垃圾块过滤
  - [ ] **CSDN (`csdn.net`)**：已在 content.js 写入过滤，待在单页转换进一步测试
  - [ ] **简书 (`jianshu.com`)**：正文提取过滤
  - [ ] **B站专栏 (`bilibili.com/read`)**：图文卡片与评论剥离
  - [ ] **虎嗅 (`huxiu.com`)**：商业长文与摘要清洗
  - [ ] **爱范儿 (`ifanr.com`)**
  - [ ] **V2EX (`v2ex.com`)**：主题帖及楼主回复楼层净化
  - [ ] **Medium (`medium.com`)**：付费墙降级测试
  - [ ] **Substack (`substack.com`)**
  - [ ] **GitHub (`github.com`)**：Issue / Discussion 干净转换
  - [ ] **X / Twitter (`x.com`)**：已注入 Obsidian 同等品质 Frontmatter 与高清图，待在网页端测试
  - [ ] **Wikipedia (`wikipedia.org`)**
  - [ ] **开源中国 (`oschina.net`)**
  - [ ] **雪球 (`xueqiu.com`)**：财经长文提取
