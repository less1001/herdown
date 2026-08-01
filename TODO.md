# Herdown待办清单

## 当前优先级

1. 首页和文案统一
- 把首页、功能页、帮助文案统一成“网页、文档和图片整理成适合AI知识库使用的干净资料”。
- 去掉明显过时的旧说法，保留现有功能入口不变。

2. 支付入口切换
- 把当前支付方案从Stripe口径切到新平台口径。
- 保持前端按钮和后端下单流程可继续用，不影响现有解析和下载功能。

3. 文件能力补齐
- 补齐TXT转Markdown。
- 补齐URL转Markdown。
- 补齐PPT转Markdown。
- 补齐Excel转Markdown。
- 保留网页转Markdown和图片整理能力。

4. 本地文档和图片处理
- 把MarkItDown接到本地文档处理流程里，用来处理docx、pdf、pptx、xlsx。
- 把Unlimited-OCR先做成本地Skill，不额外买VPS，不增加固定服务器成本。
- 图片和截图识别优先走本地技能或本地工具链。

5. 接口整理
- 保留单页解析接口。
- 保留全站抓取接口。
- 保留网页转JSON结构化数据接口。
- 保留自定义筛选和站点地图接口。

6. SEO和对外说明
- 增加帮助文档。
- 增加常见问题。
- 增加robots.txt、sitemap.xml、llms.txt、llms-full.txt。
- 增加更清楚的产品说明页，让用户一进来就知道怎么用。

7. 集成说明
- 补充给Dify、Coze、FastGPT、n8n这类工作流平台的接入说明。
- 重点说明Herdown是干净资料生成器，不做完整知识库问答。

8. 质量保障
- 每次改动后先构建，再做真实URL验证。
- 确保新功能不影响旧功能。

## 暂不做

- Prompt评测平台
- Badcase系统
- 单独的知识库问答产品
- 单独的Markdown转Obsidian产品
- 小红书转Markdown独立页面
- 知乎转Markdown独立页面
- 额外VPS长期在线服务

