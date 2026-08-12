---
name: herdown-extension-qa
description: Optimize and acceptance-test the Herdown browser extension clipping pipeline against real webpages and Obsidian Web Clipper. Use when improving, refreshing, testing, comparing, or preparing the Herdown extension for release, especially for WeChat public articles, dynamic pages, images, metadata, Markdown output, or Chrome Web Store updates.
---

# Herdown插件验收

## 目标

以同一页面的Obsidian Web Clipper结果为基准，持续优化Herdown插件的真实剪藏质量。插件能打开不等于通过，必须检查导出的Markdown是否适合直接进入Obsidian或AI工作流。

## 工作流程

1. 定位项目

确认真实仓库和插件目录。默认检查`/Volumes/Samsung T7/antigravity/herdown/apps/extension`、共享解析器`packages/core`和打包脚本`apps/web/scripts/build-extension-zip.mjs`。先查看工作区状态，不覆盖用户已有改动。

2. 记录基线

在修改前用同一网址分别生成Herdown和Obsidian Web Clipper结果。重点记录标题、来源、作者、发布时间、保存时间、描述、标签、标题层级、正文、链接、图片、代码、表格、广告和推荐内容。

3. 刷新插件

完成修改后执行JavaScript语法检查、共享解析器检查和插件打包。打开Chrome扩展管理页刷新Herdown插件，再重新打开测试页面，避免拿旧版本结果判断。

4. 真实页面矩阵

至少覆盖公众号文章、普通长文、动态网页、技术文档、图片较多的网页，以及Obsidian Web Clipper本身处理不理想但Herdown有机会改善的页面。公众号测试必须检查正文、图片、账号、作者和发布时间。

5. 同页对比

对同一个网址分别使用Herdown和Obsidian Web Clipper。比较导出的实际文件，不只比较插件弹窗是否显示结果。确认Herdown至少达到Obsidian的可读性，并在图片、链接、代码和中文网页结构上尽量更好。

6. 通过标准

确认YAML位于文件开头且可解析，标题不重复，正文没有原始`<img>`标签、脚本、广告、导航、评论区、二维码和推荐噪音。图片应使用可用的Markdown图片引用，链接应可点击，中文编码正常，代码块和表格不能被打散。

7. 回归检查

修改后再次跑同一页面矩阵，特别检查公众号图片没有重复追加、元数据没有退化、旧的复制和下载功能仍然可用。必要时检查`node --check apps/extension/*.js`、`pnpm --filter @herdown/core check`和`pnpm --filter @herdown/web check`。

8. 发布前记录

报告每个网址的Herdown结果、Obsidian基线、通过项、失败项和剩余风险。本地优化阶段只确认源码、版本号和Chrome本地加载目录一致。只有用户明确验收通过后，才生成Chrome上传包或更新网站入口；未得到明确授权，不得Git提交、推送或Cloudflare发布。
