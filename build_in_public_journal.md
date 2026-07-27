# 🪵 Build in Public — MD for Agents 项目创业与开发复盘全景日志

*创建时间：北京时间 2026年7月27日 01:46*  
*核心规则：每完成 5 次深度对话交流后，自动归纳总结并累加追加至本文档，供项目复盘与公开构建 (Build in Public) 文章创作使用。*

---

## 📅 阶段复盘日志 01：Agent 扩展生态、RAG 向量切分与商业竞对深析

### 1. 核心技术与产品突破
- **标准 Agent Skill (SKILL.md) 全量发布**：
  - 在 `packages/cli/SKILL.md` 编写了符合 Hermes Agent、Claude Code、OpenClaw、QClaw、Antigravity 标准的技能定义文件。
  - 在前端 Web UI (`allto.agentok.top`) 增加了 `⚡ Agent Skill` 专属选项卡，提供一键复制 SKILL.md 面板，降低用户集成门槛。
- **RAG 向量切分接口 (`/v1/vectorize`) 商业定位澄清**：
  - 明确了 RAG 架构的三步走流程（清洗切块 ➔ Embedding ➔ 向量检索）。
  - MD for Agents 切入的是 RAG 流程中最脏、最累、也最决定检索质量的“前端网页清洗与语义 Chunking 切块”基建层。

### 2. 竞对资本与团队背景全景
- **Firecrawl (`firecrawl.dev`)**：
  - 融资 2 次（Y Combinator S22 + Series A $1,450 万美元），累计融资 **$1,620 万美元（约 1.17 亿元人民币）**，估值约为 **$6,000万 ~ $1亿美元**。
  - 团队约 49 人，总部旧金山。重资产跑无头 Chrome 与昂贵代理 IP，每月烧钱严重。
- **Jina AI (`jina.ai`)**：
  - 累计融资 **$3,900 万美元（约 2.8 亿元人民币）**，A 轮峰值估值 $1.5 亿美元。
  - **最新归宿**：2025 年 10 月被纽交所上市公司 **Elastic (NYSE: ESTC)** 以 **$4,330 万美元（约 3.1 亿元人民币）** 完成全资收购。

### 3. 差异化护城河与“被 Computer Use 替代”答疑
- **商业护城河**：
  - 物理成本 $0（Cloudflare Serverless），毛利率 90%+，生存能力极强。
  - 中文生态（微信 100% 完整长文/去重、知乎 LaTeX 公式保留、小红书高清原图）独家垄断。
  - 支持微信/支付宝 ¥68 扫码支付，解决国内 90% 开发者无外币卡痛点。
- **为何不会被 Agent Computer Use / 视觉浏览器替代**：
  - **Token 成本**：视觉截图交互成本高出 100 倍（$0.5 vs $0.001）。
  - **速度**：视觉截图需要 30 秒，API 只需 10 毫秒。
  - **协同关系**：Agent 先用 Computer Use 搞定复杂登录，拿到 Cookie 后调用 MD for Agents API 进行高速高并发吞吐。

---

## 📅 阶段复盘日志 02：SEO/GEO 关键词、冷启动策略与企业级文件拓展

### 1. 核心关键词与 SEO/GEO 布局
- **中文关键词（中英文无空格）**：
  `微信公众号转Markdown` / `微信文章批量导出Markdown` / `小红书笔记转Markdown` / `知乎回答转Markdown保留公式` / `AIAgent网页抓取API` / `RAG向量文本切分工具` / `Firecrawl替代品` / `Jina Reader替代` / `微信支付宝付款网页转Markdown API`
- **英文核心词**：
  `web to markdown api` / `url to markdown converter` / `llm readable markdown API` / `firecrawl alternative` / `remote mcp server for markdown` / `agent skill for web scraping`
- **Google Trends 长文澄清**：解释了长尾 4 词在谷歌指数中归零的原理，确立了以 `web scraping API` (大词) + `微信公众号转Markdown` (场景词) 双轨并行的 SEO 策略。

### 2. 冷启动与绝密营销隔离
- 制定了包含 V2EX 分享创造送点数、AI 工作流社区 (Dify/Coze) 教程、Smithery / MCP.so 索引提交的全套冷启动方案。
- **隐私保护**：将包含营销秘密的 `冷启动.md` 成功隔离在本地外部硬盘中，并在 `.gitignore` 中加入阻断规则，确保 100% 不会被提交到 GitHub 公开仓库。

### 3. 企业级 RAG 知识库与本地文件拓展
- 确立了企业文件解析的商业路径：
  - **电子版 Office/PDF**：集成微软开源 **`microsoft/markitdown`**，零成本解析 Word/PDF/PPT/Excel。
  - **扫描件/发票/单据**：集成百度开源 **`baidu/Unlimited-OCR`**，单次解析扣除 5 个点数，维持 80%+ 的超高利润率。
