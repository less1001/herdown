import type { Language } from './i18n';

export const blogArticlePath = '/blog/how-to-convert-html-to-markdown-for-ai';
export const blogArticlePaths = [
  blogArticlePath,
  '/blog/best-markdown-converter-for-ai-agents',
  '/blog/markdown-for-agents-tools',
] as const;

type Section = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

type BlogCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  articleLabel: string;
  updated: string;
  sections: Section[];
  faqTitle: string;
  faqs: Array<{ question: string; answer: string }>;
};

type Article = {
  path: string;
  zh: BlogCopy;
  en: BlogCopy;
};

const articles: Article[] = [
  {
    path: blogArticlePath,
    zh: {
      eyebrow: 'Herdown博客',
      title: '如何把HTML转换为适合AI的Markdown',
      intro: '从网页HTML中提取正文、保留语义结构，并整理成AI Agent可以稳定理解、检索和引用的Markdown。',
      articleLabel: 'AI工作流教程',
      updated: '更新日期：2026年8月10日',
      sections: [
        { heading: '为什么HTML不适合直接交给AI Agent', paragraphs: ['HTML适合浏览器渲染，不一定适合AI阅读。一个网页通常同时包含导航、广告、推荐内容、评论、脚本和样式。把整份HTML直接放进上下文，会让真正有价值的正文被大量无效内容稀释。', '高质量的转换不是简单删除标签，而是识别正文边界，保留标题层级、段落、列表、表格、链接、代码和图片说明，让内容在脱离原网页后仍然有清晰的语义。'] },
        { heading: '如何把HTML转换为适合AI的Markdown', paragraphs: ['可靠的HTML转Markdown流程包括四个检查：'], bullets: ['定位正文区域，不要转换整份网页源码。', '删除导航、广告、Cookie提示、评论、脚本、样式和重复推荐。', '保留标题、段落、列表、表格、链接、代码块、图片和图注。', '检查缺失段落、粘连表格、失效链接和不完整结尾。'] },
        { heading: '适合AI Agent的Markdown转换器应该具备什么', paragraphs: ['选择适合AI Agent的Markdown转换器时，重点是输出质量和工作流边界，而不是按钮数量。'], bullets: ['正文边界稳定，避开页眉、页脚和推荐模块。', 'H1、H2、列表、表格和代码块保持清晰结构。', '保留来源地址、标题、作者和时间等元数据。', '失败时明确说明原因，不用空白结果伪装成功。', '清晰说明本地处理和隐私边界。'] },
        { heading: 'AI Agent资料整理工具如何组成工作流', paragraphs: ['AI Agent资料整理工具更适合组成一条小型工作流：网页转Markdown处理公开URL，文件转Markdown处理Word、文字型PDF、PPT、Excel、CSV、JSON、XML和RTF，Markdown查看器负责检查，Markdown转HTML、PDF和Word负责交付，平台排版工具负责发布。'] },
        { heading: '使用Herdown的实际流程', paragraphs: ['把公开网页URL粘贴到网页转Markdown页面，或选择对应的本地文件工具；检查预览和Markdown源码中的标题、表格、代码、链接和文章结尾；需要交付时导出为HTML、PDF或Word，需要发布时使用微信公众号或小红书工具。'] },
      ],
      faqTitle: '常见问题',
      faqs: [
        { question: 'HTML转Markdown会保留原网页的视觉样式吗？', answer: '不会完全保留。Markdown优先保留语义结构，固定布局和复杂CSS需要在HTML或原网页中查看。' },
        { question: '为什么转换后还需要人工检查？', answer: '复杂表格、脚注、代码块、懒加载图片和登录后内容可能无法从公开HTML中完整获取。' },
        { question: 'AI Agent为什么更适合使用Markdown？', answer: 'Markdown的标题、列表、表格和代码块边界明确，长度更可控，也更容易被检索和继续处理。' },
      ],
    },
    en: {
      eyebrow: 'Herdown Blog',
      title: 'How to Convert HTML to Markdown for AI',
      intro: 'Extract useful content from webpage HTML, preserve its meaning, and prepare Markdown that AI agents can read, retrieve, and cite reliably.',
      articleLabel: 'AI workflow guide',
      updated: 'Updated August 10, 2026',
      sections: [
        { heading: 'Why raw HTML is a poor input for AI agents', paragraphs: ['HTML is built for browser rendering, not clean retrieval. A modern page can contain navigation, ads, recommendations, comments, scripts, styles, and consent banners around the content a reader needs.', 'A good conversion identifies the main content boundary and keeps headings, paragraphs, lists, tables, links, code, images, and captions meaningful after the page layout is gone.'] },
        { heading: 'How to Convert HTML to Markdown for AI', paragraphs: ['A reliable HTML-to-Markdown workflow includes four checks:'], bullets: ['Locate the main article or document body instead of converting the whole page.', 'Remove navigation, ads, cookie banners, comments, scripts, styles, and repeated recommendations.', 'Preserve semantic headings, paragraphs, lists, tables, links, code blocks, images, and captions.', 'Review missing paragraphs, merged table cells, broken links, and incomplete endings.'] },
        { heading: 'What makes the best Markdown converter for AI agents', paragraphs: ['When you search for the best markdown converter for ai agents, compare output quality and workflow boundaries rather than the number of buttons.'], bullets: ['Stable content boundaries that avoid headers, footers, and recommendation modules.', 'Readable H1, H2, list, table, and code-block structure.', 'Source metadata such as URL, title, author, and publication date.', 'Clear failures instead of an empty result that looks successful.', 'A clear local-processing or privacy boundary.'] },
        { heading: 'How Markdown for Agents Tools fit together', paragraphs: ['Markdown for agents tools work best as a small workflow: webpage to Markdown for public URLs, document to Markdown for files, Markdown Viewer for checking, Markdown to HTML, PDF, and Word for delivery, and publishing tools for platform-specific layouts.'] },
        { heading: 'A practical Herdown workflow', paragraphs: ['Paste a public URL into URL to Markdown or choose the local tool for your file type. Review the preview and Markdown source, check headings, tables, code blocks, links, and the ending, then export to HTML, PDF, or Word or publish with the WeChat and Xiaohongshu tools.'] },
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        { question: 'Does HTML to Markdown preserve the original visual design?', answer: 'Not completely. Markdown preserves semantic structure, while fixed layouts and complex CSS belong in HTML or the original page.' },
        { question: 'Why should I review the output?', answer: 'Complex tables, footnotes, code blocks, lazy-loaded images, and login-only content may not be fully available in public HTML.' },
        { question: 'Why is Markdown useful for AI agents?', answer: 'Headings, lists, tables, and code blocks have clear boundaries. The result is easier to control, retrieve, and pass to another tool.' },
      ],
    },
  },
  {
    path: '/blog/best-markdown-converter-for-ai-agents',
    zh: {
      eyebrow: 'Herdown博客',
      title: '如何选择适合AI Agent的Markdown转换器',
      intro: '从正文识别、结构保留、隐私边界和下游交付四个维度，判断Markdown转换器是否真的适合AI Agent。',
      articleLabel: '工具选择指南',
      updated: '更新日期：2026年8月11日',
      sections: [
        { heading: '不要只比较支持多少种格式', paragraphs: ['很多Markdown转换器会用格式数量展示能力，但AI Agent真正需要的是稳定、可检索、少噪声的内容。支持几十种输入格式，如果正文边界不准确，最后仍然会得到难以使用的材料。', '选择工具时，要把一次转换看成一条资料交付链：输入被识别，正文被提取，结构被保留，来源被记录，结果还要能继续进入知识库或Agent工作流。'] },
        { heading: '评估AI Agent Markdown转换器的五项指标', paragraphs: ['选择AI Agent Markdown转换器时可以按下面五项指标检查：'], bullets: ['正文边界：能否避开导航、广告、评论、推荐模块和Cookie提示。', '结构质量：标题、列表、表格、代码块、引用和链接是否保持语义。', '来源追踪：是否保留原始URL、标题、作者、发布时间和站点信息。', '失败反馈：遇到登录墙、扫描版PDF或受保护资源时是否明确说明。', '隐私处理：文件是否可以在浏览器本地处理，远程解析是否说明数据边界。'] },
        { heading: '不同输入场景应该使用不同工具', paragraphs: ['公开网页适合使用URL转Markdown；文字型PDF、Word、PPT和Excel适合使用本地文件工具；扫描版或图片型资料需要OCR；已经有Markdown时，则应该使用Viewer或输出工具继续处理。'] },
        { heading: '为什么Herdown适合Agent资料准备', paragraphs: ['Herdown把网页解析、文件转换、Markdown查看和输出工具分开，用户可以先清洗资料，再决定交付格式。网页解析保留来源信息，本地文件工具不需要上传文件，结果可以继续导出HTML、PDF、Word或平台排版格式。'] },
        { heading: '一个可复用的检查清单', paragraphs: ['每次转换后，建议检查H1是否唯一、H2层级是否连续、表格列是否错位、代码块是否完整、链接是否仍然有效、文章结尾是否被截断，以及来源URL是否保留。'] },
      ],
      faqTitle: '常见问题',
      faqs: [
        { question: '格式越多的转换器就越好吗？', answer: '不一定。正文边界、结构质量、来源追踪和失败反馈通常比格式数量更重要。' },
        { question: 'AI Agent需要什么样的Markdown？', answer: '需要标题层级清楚、段落完整、表格和代码块可读，并且带有可追溯的来源信息。' },
        { question: '什么时候不应该使用在线转换？', answer: '涉及敏感文件、扫描资料或无法公开访问的内容时，应优先使用本地工具或本地OCR流程。' },
      ],
    },
    en: {
      eyebrow: 'Herdown Blog',
      title: 'Best Markdown Converter for AI Agents: What to Compare',
      intro: 'Evaluate a Markdown converter for AI agents by content boundaries, semantic structure, privacy, and the handoff to downstream tools.',
      articleLabel: 'Tool selection guide',
      updated: 'Updated August 11, 2026',
      sections: [
        { heading: 'Do not compare converters by format count alone', paragraphs: ['Many Markdown converters advertise the number of formats they support. AI agents need something more specific: stable, searchable, low-noise material. Dozens of input formats do not help if the main content boundary is wrong.', 'Treat each conversion as a delivery chain. The input must be recognized, the useful content extracted, its structure preserved, its source recorded, and the result prepared for a knowledge base or agent workflow.'] },
        { heading: 'Five ways to evaluate the best Markdown converter for AI agents', paragraphs: ['Use these five checks when comparing the best markdown converter for ai agents:'], bullets: ['Content boundaries: does it avoid navigation, ads, comments, recommendations, and cookie banners?', 'Semantic quality: are headings, lists, tables, code blocks, quotes, and links preserved?', 'Source traceability: are the original URL, title, author, date, and site information kept?', 'Failure feedback: does it clearly explain login walls, scanned PDFs, and protected resources?', 'Privacy: can files be processed locally, and are remote parsing boundaries clear?'] },
        { heading: 'Use a different tool for each input scenario', paragraphs: ['Use URL to Markdown for public webpages, local file tools for text PDFs, Word, presentations, and spreadsheets, OCR for scanned or image-based material, and Markdown Viewer or output tools when the source is already Markdown.'] },
        { heading: 'Why Herdown works for agent material preparation', paragraphs: ['Herdown separates webpage parsing, local file conversion, Markdown review, and output tools. You can clean the material first and choose the delivery format later. Web parsing keeps source information, local file tools avoid uploading files, and the result can move to HTML, PDF, Word, or publishing layouts.'] },
        { heading: 'A reusable review checklist', paragraphs: ['After each conversion, check that there is one H1, heading levels are logical, table columns are aligned, code blocks are complete, links still work, the ending is present, and the source URL is retained.'] },
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        { question: 'Is a converter with more formats always better?', answer: 'No. Content boundaries, semantic quality, source traceability, and clear failures often matter more than format count.' },
        { question: 'What Markdown do AI agents need?', answer: 'They need clear headings, complete paragraphs, readable tables and code blocks, and traceable source information.' },
        { question: 'When should I avoid online conversion?', answer: 'For sensitive files, scans, or content that is not public, prefer local tools or a local OCR workflow.' },
      ],
    },
  },
  {
    path: '/blog/markdown-for-agents-tools',
    zh: {
      eyebrow: 'Herdown博客',
      title: 'AI Agent资料整理工具工作流指南',
      intro: '把网页、文件、Markdown查看、格式输出和平台发布工具连接起来，建立一条适合AI Agent的资料处理流程。',
      articleLabel: '工作流教程',
      updated: '更新日期：2026年8月11日',
      sections: [
        { heading: 'AI Agent需要的不是一个万能按钮', paragraphs: ['Agent工作流通常同时处理网页、文档、表格、代码和发布内容。一个页面很难在所有输入上都提供同样可靠的结果，更好的方式是让每个工具承担清楚的一步。', 'Markdown适合作为中间格式，因为标题、列表、表格、代码和链接都能用相对简单的结构表达，方便人检查，也方便Agent继续检索和改写。'] },
        { heading: 'AI Agent资料整理工具应该包含哪些环节', paragraphs: ['一条完整的AI Agent资料整理工具工作流通常包括：'], bullets: ['输入采集：从公开网页URL、粘贴HTML或本地文件开始。', '内容清洗：删除导航、广告和重复模块，保留正文语义。', '格式检查：使用Markdown查看器检查标题、表格、代码、链接和图片。', '结果交付：导出HTML、PDF、Word、CSV或继续保存为Markdown。', '平台发布：针对微信公众号和小红书重新排版，而不是直接复制原始HTML。'] },
        { heading: '远程网页解析和本地文件处理如何分工', paragraphs: ['公开网页适合通过远程解析获取正文和来源信息，但私密文件、文字型PDF、Word、PPT、Excel和CSV更适合在浏览器本地处理。扫描版PDF和图片资料还需要本地OCR，不应该把不支持的输入伪装成成功结果。'] },
        { heading: '交给Agent之前要保留什么', paragraphs: ['建议保留来源URL、标题、作者、发布时间和处理限制。结果正文中要保持清晰的H1、H2和H3层级，表格需要有表头，代码块需要保留语言标记，图片需要有可理解的替代文字。'] },
        { heading: '使用Herdown搭建这条流程', paragraphs: ['先用网页转Markdown或本地文件工具得到干净内容，再用Markdown Viewer人工检查，最后根据任务选择Markdown转HTML、PDF、Word、微信公众号或小红书工具。这样可以把内容清洗和最终发布分开，减少重复修改。'] },
      ],
      faqTitle: '常见问题',
      faqs: [
        { question: '为什么不直接把HTML交给Agent？', answer: 'HTML通常包含大量导航、样式、脚本和推荐内容，Markdown更容易控制上下文长度和语义边界。' },
        { question: 'Markdown Viewer在工作流中有什么作用？', answer: '它可以帮助你在交付前检查标题层级、表格、代码、链接、图片和文章结尾。' },
        { question: '所有文件都适合在线处理吗？', answer: '不适合。敏感文件、扫描版PDF和图片资料应根据页面限制选择本地处理或本地OCR。' },
      ],
    },
    en: {
      eyebrow: 'Herdown Blog',
      title: 'Markdown for Agents Tools: A Practical Workflow',
      intro: 'Connect webpage extraction, local files, Markdown review, format exports, and publishing tools into a workflow built for AI agents.',
      articleLabel: 'Workflow guide',
      updated: 'Updated August 11, 2026',
      sections: [
        { heading: 'AI agents do not need one oversized button', paragraphs: ['Agent workflows handle webpages, documents, spreadsheets, code, and publishing content. One page rarely produces equally reliable results for every input, so each tool should own a clear step.', 'Markdown works well as an intermediate format because headings, lists, tables, code, and links have simple boundaries that people can review and agents can retrieve or rewrite.'] },
        { heading: 'What Markdown for Agents Tools should include', paragraphs: ['A complete markdown for agents tools workflow usually includes:'], bullets: ['Input capture from public URLs, pasted HTML, or local files.', 'Content cleaning that removes navigation, ads, and repeated modules while keeping meaning.', 'Markdown review for headings, tables, code, links, and images.', 'Delivery through HTML, PDF, Word, CSV, or a saved Markdown file.', 'Platform publishing layouts for WeChat and Xiaohongshu instead of raw HTML copy and paste.'] },
        { heading: 'How remote webpages and local files fit together', paragraphs: ['Use remote parsing for public webpages and source information. Use local browser tools for private files, text PDFs, Word, presentations, spreadsheets, and CSV. Scanned PDFs and image materials need local OCR, and unsupported input should produce a clear limitation rather than a false success.'] },
        { heading: 'What to preserve before handing material to an agent', paragraphs: ['Keep the source URL, title, author, publication date, and processing limits. The body should have clear H1, H2, and H3 levels, tables should have headers, code blocks should keep language labels, and images should have meaningful alternative text.'] },
        { heading: 'Build the workflow with Herdown', paragraphs: ['Start with URL to Markdown or the local file tool, review the result in Markdown Viewer, then choose Markdown to HTML, PDF, Word, WeChat, or Xiaohongshu based on the next task. Separating cleaning from publishing reduces repeated edits.'] },
      ],
      faqTitle: 'Frequently asked questions',
      faqs: [
        { question: 'Why not send HTML directly to an agent?', answer: 'HTML often contains navigation, styles, scripts, and recommendations. Markdown gives the context a clearer and more controllable boundary.' },
        { question: 'What does Markdown Viewer add to the workflow?', answer: 'It lets you review heading levels, tables, code, links, images, and the ending before delivery.' },
        { question: 'Can every file be processed online?', answer: 'No. Sensitive files, scanned PDFs, and image materials should follow the page limitations and use local processing or local OCR when needed.' },
      ],
    },
  },
];

const localizedCopies: Record<'ja' | 'es' | 'de', Record<string, BlogCopy>> = {
  ja: {
    [blogArticlePath]: {
      eyebrow: 'Herdownブログ', title: 'HTMLをAI向けMarkdownに変換する方法', intro: 'WebページのHTMLから本文を抽出し、意味構造を保ったMarkdownに整えて、AIエージェントが安定して読めるようにします。', articleLabel: 'AIワークフローガイド', updated: '更新日：2026年8月10日',
      sections: [
        { heading: 'なぜ生のHTMLはAIエージェントに向かないのか', paragraphs: ['HTMLはブラウザで表示するための形式であり、検索やAIの読み取りに最適化された形式ではありません。ナビゲーション、広告、コメント、スクリプト、スタイルが本文の周囲に含まれています。', '良い変換はタグを削除するだけではありません。本文の範囲を見つけ、見出し、段落、リスト、表、リンク、コード、画像の説明を残す必要があります。'] },
        { heading: 'HTMLをAI向けMarkdownに変換する方法', paragraphs: ['信頼できる変換では、次の4点を確認します。'], bullets: ['ページ全体ではなく本文や記事の領域を特定する。', 'ナビゲーション、広告、Cookie通知、コメント、スクリプト、スタイル、重複したおすすめを削除する。', '見出し、段落、リスト、表、リンク、コード、画像とキャプションを保持する。', '欠落した段落、結合した表、壊れたリンク、途中で切れた末尾を確認する。'] },
        { heading: 'AIエージェント向けMarkdown変換ツールの条件', paragraphs: ['変換ツールを選ぶときは、ボタンの数ではなく出力の品質とプライバシーの境界を比較します。'], bullets: ['本文の境界が安定している。', 'H1、H2、リスト、表、コードの構造が読みやすい。', 'URL、タイトル、著者、公開日などの出典情報を残せる。', '失敗したときに原因を明確に表示する。', 'ローカル処理とリモート処理の範囲が説明されている。'] },
        { heading: 'Herdownを使った実践フロー', paragraphs: ['公開URLをURLからMarkdownツールに入力するか、ファイル形式に合うローカルツールを選びます。プレビューとMarkdownソースを確認し、必要に応じてHTML、PDF、Word、WeChat、Xiaohongshu向けに出力します。'] },
      ],
      faqTitle: 'よくある質問', faqs: [
        { question: 'HTMLからMarkdownに変換すると見た目も保存されますか？', answer: '完全には保存されません。Markdownは意味構造を優先し、固定レイアウトや複雑なCSSはHTMLや元ページで確認します。' },
        { question: 'なぜ変換結果を確認する必要がありますか？', answer: '複雑な表、脚注、コード、遅延読み込み画像、ログインが必要な内容は公開HTMLから完全に取得できない場合があります。' },
        { question: 'AIエージェントにMarkdownが向いている理由は何ですか？', answer: '見出し、リスト、表、コードの境界が明確で、検索や次の処理に渡しやすいからです。' },
      ],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      eyebrow: 'Herdownブログ', title: 'AIエージェント向けMarkdown変換ツールの選び方', intro: '本文の範囲、意味構造、出典、失敗表示、プライバシーからMarkdown変換ツールを比較します。', articleLabel: 'ツール選定ガイド', updated: '更新日：2026年8月11日',
      sections: [
        { heading: '対応形式の数だけで比較しない', paragraphs: ['AIエージェントが必要とするのは、形式の多さよりも安定して検索できるノイズの少ない資料です。本文の範囲を正しく認識できなければ、多くの入力形式に対応していても結果は使いにくくなります。'] },
        { heading: 'Markdown変換ツールを評価する5つの指標', paragraphs: ['AIエージェント向けの変換ツールは次の5点で確認します。'], bullets: ['ナビゲーション、広告、コメント、おすすめを本文から分離できるか。', '見出し、リスト、表、コード、引用、リンクを保持できるか。', 'URL、タイトル、著者、公開日を追跡できるか。', 'ログイン制限やスキャンPDFに対して原因を表示できるか。', 'ローカル処理とリモート処理のデータ範囲が明確か。'] },
        { heading: '入力の種類ごとにツールを分ける', paragraphs: ['公開ページはURLからMarkdown、テキストPDFやWord、PPT、Excelはローカルツール、スキャン資料はローカルOCR、既存のMarkdownはViewerや出力ツールを使うと整理しやすくなります。'] },
        { heading: '変換後に使える確認リスト', paragraphs: ['H1が1つだけか、見出しの順序が自然か、表の列がずれていないか、コードが欠けていないか、リンクと末尾が完全か、出典URLが残っているかを確認します。'] },
      ],
      faqTitle: 'よくある質問', faqs: [
        { question: '対応形式が多いツールほど優れていますか？', answer: '必ずしもそうではありません。本文の境界、構造、出典、失敗時の説明のほうが重要です。' },
        { question: 'AIエージェントに必要なMarkdownとは何ですか？', answer: '見出しと段落が明確で、表とコードが読みやすく、出典を追跡できるMarkdownです。' },
        { question: 'オンライン変換を避けるべき場合はありますか？', answer: '機密ファイルやスキャン資料では、ローカル処理またはローカルOCRを優先してください。' },
      ],
    },
    '/blog/markdown-for-agents-tools': {
      eyebrow: 'Herdownブログ', title: 'AIエージェント向け資料整理ツールのワークフロー', intro: 'Web抽出、ローカルファイル、Markdown確認、形式出力、公開をAIエージェント向けの流れにまとめます。', articleLabel: 'ワークフローガイド', updated: '更新日：2026年8月11日',
      sections: [
        { heading: 'AIエージェントに万能ボタンは必要ない', paragraphs: ['エージェントの作業では、Webページ、文書、表計算、コード、公開用コンテンツを扱います。すべてを1つのツールに任せるより、各ツールに明確な役割を持たせるほうが安定します。'] },
        { heading: 'AIエージェント向け資料整理ツールの構成', paragraphs: ['実用的な流れには次の段階があります。'], bullets: ['公開URL、貼り付けたHTML、ローカルファイルを入力する。', 'ナビゲーション、広告、重複モジュールを除去する。', 'Markdown Viewerで見出し、表、コード、リンク、画像を確認する。', 'HTML、PDF、Word、CSVまたはMarkdownとして出力する。', 'WeChatやXiaohongshu向けに公開用レイアウトを整える。'] },
        { heading: 'Web解析とローカルファイル処理の分担', paragraphs: ['公開ページはリモート解析、機密ファイルや文書はブラウザ内のローカル処理、スキャンPDFや画像はローカルOCRに分けます。対応外の入力を成功したように表示しないことも重要です。'] },
        { heading: 'エージェントに渡す前に残す情報', paragraphs: ['元URL、タイトル、著者、公開日、処理上の制限を残します。H1、H2、H3、表の見出し、コードの言語、画像の代替テキストも維持します。'] },
      ],
      faqTitle: 'よくある質問', faqs: [
        { question: 'HTMLをそのままエージェントに渡さない理由は何ですか？', answer: 'HTMLにはナビゲーション、スタイル、スクリプト、おすすめが含まれやすく、Markdownのほうが文脈の境界を管理しやすいからです。' },
        { question: 'Markdown Viewerは何に役立ちますか？', answer: '公開や納品の前に、見出し、表、コード、リンク、画像、末尾を確認できます。' },
        { question: 'すべてのファイルをオンライン処理できますか？', answer: 'いいえ。機密ファイル、スキャンPDF、画像資料はローカル処理やローカルOCRを選びます。' },
      ],
    },
  },
  es: {
    [blogArticlePath]: {
      eyebrow: 'Blog de Herdown', title: 'Cómo convertir HTML a Markdown para IA', intro: 'Extrae el contenido principal del HTML de una página y conserva su estructura para que los agentes de IA puedan leerlo y recuperarlo.', articleLabel: 'Guía de flujo de IA', updated: 'Actualizado el 10 de agosto de 2026',
      sections: [
        { heading: 'Por qué el HTML sin limpiar no es una buena entrada para la IA', paragraphs: ['El HTML está diseñado para mostrar páginas en un navegador, no para recuperar contenido limpio. Una página puede mezclar navegación, anuncios, comentarios, scripts, estilos y recomendaciones con el texto útil.', 'Una buena conversión identifica el límite del contenido principal y conserva títulos, párrafos, listas, tablas, enlaces, código, imágenes y pies de imagen.'] },
        { heading: 'Cómo convertir HTML a Markdown para IA', paragraphs: ['Un flujo fiable incluye cuatro comprobaciones:'], bullets: ['Localizar el artículo o documento principal en lugar de convertir todo el código fuente.', 'Eliminar navegación, anuncios, avisos de cookies, comentarios, scripts, estilos y recomendaciones repetidas.', 'Conservar títulos, párrafos, listas, tablas, enlaces, bloques de código, imágenes y pies de imagen.', 'Revisar párrafos ausentes, tablas unidas, enlaces rotos y finales incompletos.'] },
        { heading: 'Qué debe tener un conversor Markdown para agentes de IA', paragraphs: ['La calidad del resultado y los límites de privacidad importan más que la cantidad de botones.'], bullets: ['Límites de contenido estables.', 'Estructura clara de H1, H2, listas, tablas y código.', 'URL, título, autor y fecha para rastrear la fuente.', 'Errores claros cuando una página no se puede procesar.', 'Procesamiento local o límites remotos explicados.'] },
        { heading: 'Flujo práctico con Herdown', paragraphs: ['Pega una URL pública en URL a Markdown o elige la herramienta local para tu archivo. Revisa la vista previa y el Markdown, y después exporta a HTML, PDF, Word o a un formato de publicación.'] },
      ],
      faqTitle: 'Preguntas frecuentes', faqs: [
        { question: '¿HTML a Markdown conserva el diseño visual?', answer: 'No completamente. Markdown conserva la estructura semántica; los diseños fijos y el CSS complejo pertenecen al HTML o a la página original.' },
        { question: '¿Por qué debo revisar el resultado?', answer: 'Las tablas complejas, notas, código, imágenes de carga diferida y contenido con acceso restringido pueden no estar completos en el HTML público.' },
        { question: '¿Por qué Markdown sirve para agentes de IA?', answer: 'Sus títulos, listas, tablas y bloques de código tienen límites claros y son más fáciles de recuperar y procesar.' },
      ],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      eyebrow: 'Blog de Herdown', title: 'Cómo elegir el mejor conversor Markdown para agentes de IA', intro: 'Compara conversores Markdown por sus límites de contenido, estructura, fuentes, errores y privacidad.', articleLabel: 'Guía para elegir herramientas', updated: 'Actualizado el 11 de agosto de 2026',
      sections: [
        { heading: 'No compares solo la cantidad de formatos', paragraphs: ['Los agentes de IA necesitan material estable, recuperable y con poco ruido. Muchos formatos no sirven si el conversor no identifica bien el contenido principal.'] },
        { heading: 'Cinco criterios para elegir un conversor Markdown', paragraphs: ['Comprueba estos cinco puntos:'], bullets: ['Separación entre contenido principal, navegación, anuncios, comentarios y recomendaciones.', 'Conservación de títulos, listas, tablas, código, citas y enlaces.', 'Seguimiento de URL, título, autor y fecha de publicación.', 'Mensajes claros para muros de inicio de sesión, PDF escaneado y recursos protegidos.', 'Límites claros entre procesamiento local y remoto.'] },
        { heading: 'Usa una herramienta distinta para cada entrada', paragraphs: ['Usa URL a Markdown para páginas públicas, herramientas locales para PDF de texto, Word, presentaciones y hojas de cálculo, OCR local para documentos escaneados y Markdown Viewer cuando el origen ya sea Markdown.'] },
        { heading: 'Lista de revisión reutilizable', paragraphs: ['Comprueba que haya un solo H1, niveles de título lógicos, columnas alineadas, bloques de código completos, enlaces válidos, final completo y URL de origen.'] },
      ],
      faqTitle: 'Preguntas frecuentes', faqs: [
        { question: '¿Un conversor con más formatos siempre es mejor?', answer: 'No. Los límites de contenido, la estructura, las fuentes y los errores claros suelen importar más.' },
        { question: '¿Qué Markdown necesitan los agentes de IA?', answer: 'Títulos claros, párrafos completos, tablas y código legibles, además de fuentes rastreables.' },
        { question: '¿Cuándo debo evitar una conversión online?', answer: 'Para archivos sensibles, escaneos o contenido privado, usa procesamiento local u OCR local.' },
      ],
    },
    '/blog/markdown-for-agents-tools': {
      eyebrow: 'Blog de Herdown', title: 'Flujo de trabajo de herramientas Markdown para agentes de IA', intro: 'Conecta extracción web, archivos locales, revisión Markdown, exportación y publicación en un flujo práctico para agentes de IA.', articleLabel: 'Guía de flujo de trabajo', updated: 'Actualizado el 11 de agosto de 2026',
      sections: [
        { heading: 'Los agentes no necesitan un botón universal', paragraphs: ['Los flujos de agentes trabajan con páginas, documentos, hojas de cálculo, código y contenido para publicar. Cada herramienta debe tener una función clara y Markdown puede servir como formato intermedio.'] },
        { heading: 'Qué debe incluir un flujo de herramientas Markdown', paragraphs: ['Un flujo completo incluye:'], bullets: ['Captura desde URL públicas, HTML pegado o archivos locales.', 'Limpieza que elimina navegación, anuncios y módulos repetidos.', 'Revisión de títulos, tablas, código, enlaces e imágenes.', 'Entrega en HTML, PDF, Word, CSV o Markdown.', 'Diseños de publicación para WeChat y Xiaohongshu.'] },
        { heading: 'Cómo combinar páginas remotas y archivos locales', paragraphs: ['Usa análisis remoto para páginas públicas y herramientas locales para archivos privados, PDF de texto, Word, presentaciones, hojas de cálculo y CSV. Los escaneos y las imágenes necesitan OCR local.'] },
        { heading: 'Qué conservar antes de entregar el material a un agente', paragraphs: ['Conserva URL, título, autor, fecha y límites de procesamiento. Mantén H1, H2, H3, cabeceras de tablas, etiquetas de lenguaje del código y textos alternativos de imágenes.'] },
      ],
      faqTitle: 'Preguntas frecuentes', faqs: [
        { question: '¿Por qué no enviar HTML directamente al agente?', answer: 'HTML suele contener navegación, estilos, scripts y recomendaciones. Markdown ofrece límites de contexto más claros.' },
        { question: '¿Para qué sirve Markdown Viewer?', answer: 'Permite revisar títulos, tablas, código, enlaces, imágenes y el final antes de entregar el contenido.' },
        { question: '¿Se puede procesar cualquier archivo online?', answer: 'No. Los archivos sensibles, PDF escaneados e imágenes deben procesarse localmente cuando sea necesario.' },
      ],
    },
  },
  de: {
    [blogArticlePath]: {
      eyebrow: 'Herdown-Blog', title: 'HTML für AI in Markdown umwandeln', intro: 'Nützliche Inhalte aus dem HTML einer Webseite extrahieren und ihre Struktur für AI-Agenten erhalten.', articleLabel: 'AI-Workflow-Anleitung', updated: 'Aktualisiert am 10. August 2026',
      sections: [
        { heading: 'Warum unbearbeitetes HTML keine gute AI-Eingabe ist', paragraphs: ['HTML ist für die Darstellung im Browser gedacht, nicht für saubere Suche. Navigation, Werbung, Kommentare, Skripte, Styles und Empfehlungen stehen oft neben dem eigentlichen Inhalt.', 'Eine gute Umwandlung erkennt den Hauptinhalt und erhält Überschriften, Absätze, Listen, Tabellen, Links, Code, Bilder und Bildunterschriften.'] },
        { heading: 'HTML für AI in Markdown umwandeln', paragraphs: ['Ein zuverlässiger Ablauf umfasst vier Prüfungen:'], bullets: ['Den Hauptartikel statt des gesamten Quellcodes erkennen.', 'Navigation, Werbung, Cookie-Hinweise, Kommentare, Skripte, Styles und doppelte Empfehlungen entfernen.', 'Überschriften, Absätze, Listen, Tabellen, Links, Codeblöcke, Bilder und Bildunterschriften erhalten.', 'Fehlende Absätze, verbundene Tabellen, defekte Links und unvollständige Enden prüfen.'] },
        { heading: 'Was ein Markdown-Konverter für AI-Agenten können muss', paragraphs: ['Ausgabequalität und Datenschutzgrenzen sind wichtiger als die Zahl der Schaltflächen.'], bullets: ['Stabile Grenzen für den Hauptinhalt.', 'Klare H1-, H2-, Listen-, Tabellen- und Codestruktur.', 'URL, Titel, Autor und Datum zur Quellenprüfung.', 'Klare Fehlermeldungen bei nicht zugänglichen Seiten.', 'Verständliche Grenzen für lokale und entfernte Verarbeitung.'] },
        { heading: 'Praktischer Ablauf mit Herdown', paragraphs: ['Eine öffentliche URL in URL zu Markdown einfügen oder das lokale Werkzeug für den Dateityp wählen. Vorschau und Markdown prüfen und danach HTML, PDF, Word oder ein Veröffentlichungsformat erzeugen.'] },
      ],
      faqTitle: 'Häufige Fragen', faqs: [
        { question: 'Bleibt das visuelle Design bei HTML zu Markdown erhalten?', answer: 'Nicht vollständig. Markdown erhält die semantische Struktur, feste Layouts und komplexes CSS bleiben in HTML oder der Originalseite.' },
        { question: 'Warum muss ich das Ergebnis prüfen?', answer: 'Komplexe Tabellen, Fußnoten, Code, verzögert geladene Bilder und geschützte Inhalte können im öffentlichen HTML fehlen.' },
        { question: 'Warum ist Markdown für AI-Agenten geeignet?', answer: 'Überschriften, Listen, Tabellen und Codeblöcke haben klare Grenzen und lassen sich leichter suchen und weiterverarbeiten.' },
      ],
    },
    '/blog/best-markdown-converter-for-ai-agents': {
      eyebrow: 'Herdown-Blog', title: 'Den besten Markdown-Konverter für AI-Agenten auswählen', intro: 'Markdown-Konverter nach Inhaltsgrenzen, Struktur, Quellen, Fehlermeldungen und Datenschutz vergleichen.', articleLabel: 'Werkzeugauswahl', updated: 'Aktualisiert am 11. August 2026',
      sections: [
        { heading: 'Nicht nur die Zahl der Formate vergleichen', paragraphs: ['AI-Agenten brauchen stabile, durchsuchbare und rauschfreie Inhalte. Viele Formate helfen nicht, wenn der Hauptinhalt falsch erkannt wird.'] },
        { heading: 'Fünf Kriterien für einen Markdown-Konverter', paragraphs: ['Prüfe diese fünf Punkte:'], bullets: ['Hauptinhalt von Navigation, Werbung, Kommentaren und Empfehlungen trennen.', 'Überschriften, Listen, Tabellen, Code, Zitate und Links bewahren.', 'URL, Titel, Autor und Veröffentlichungsdatum nachvollziehbar halten.', 'Klare Hinweise bei Login-Schranken, gescannten PDFs und geschützten Ressourcen.', 'Grenzen zwischen lokaler und entfernter Verarbeitung erklären.'] },
        { heading: 'Für jede Eingabe das passende Werkzeug verwenden', paragraphs: ['Öffentliche Webseiten mit URL zu Markdown, Text-PDF, Word, Präsentationen und Tabellen lokal, Scans mit lokalem OCR und vorhandenes Markdown mit Markdown Viewer oder Ausgabe-Werkzeugen bearbeiten.'] },
        { heading: 'Eine wiederverwendbare Prüfliste', paragraphs: ['Ein einziges H1, logische Überschriften, passende Tabellenspalten, vollständige Codeblöcke, funktionierende Links, ein vollständiges Ende und eine erhaltene Quell-URL prüfen.'] },
      ],
      faqTitle: 'Häufige Fragen', faqs: [
        { question: 'Ist ein Konverter mit mehr Formaten immer besser?', answer: 'Nein. Inhaltsgrenzen, Struktur, Quellen und klare Fehlermeldungen sind oft wichtiger.' },
        { question: 'Welches Markdown brauchen AI-Agenten?', answer: 'Klare Überschriften, vollständige Absätze, lesbare Tabellen und Codeblöcke sowie nachvollziehbare Quellen.' },
        { question: 'Wann sollte ich keine Online-Konvertierung nutzen?', answer: 'Bei sensiblen Dateien, Scans oder privaten Inhalten lokale Verarbeitung oder lokales OCR verwenden.' },
      ],
    },
    '/blog/markdown-for-agents-tools': {
      eyebrow: 'Herdown-Blog', title: 'Markdown-Werkzeuge für AI-Agenten: Workflow', intro: 'Webextraktion, lokale Dateien, Markdown-Prüfung, Exporte und Veröffentlichung zu einem AI-Agenten-Workflow verbinden.', articleLabel: 'Workflow-Anleitung', updated: 'Aktualisiert am 11. August 2026',
      sections: [
        { heading: 'AI-Agenten brauchen keine übergroße Schaltfläche', paragraphs: ['Agenten-Workflows verarbeiten Webseiten, Dokumente, Tabellen, Code und Veröffentlichungen. Jedes Werkzeug sollte einen klaren Schritt übernehmen; Markdown eignet sich als prüfbares Zwischenformat.'] },
        { heading: 'Was ein Markdown-Werkzeug-Workflow enthalten sollte', paragraphs: ['Ein vollständiger Ablauf enthält:'], bullets: ['Eingabe aus öffentlichen URLs, eingefügtem HTML oder lokalen Dateien.', 'Bereinigung von Navigation, Werbung und doppelten Modulen.', 'Prüfung von Überschriften, Tabellen, Code, Links und Bildern.', 'Ausgabe als HTML, PDF, Word, CSV oder Markdown.', 'Spezielle Veröffentlichungs-Layouts für WeChat und Xiaohongshu.'] },
        { heading: 'Remote-Webseiten und lokale Dateien verbinden', paragraphs: ['Öffentliche Webseiten können entfernt analysiert werden. Private Dateien, Text-PDFs, Word, Präsentationen, Tabellen und CSV sollten lokal verarbeitet werden. Scans und Bilder benötigen lokales OCR.'] },
        { heading: 'Was vor der Übergabe an einen Agenten erhalten bleiben muss', paragraphs: ['Quell-URL, Titel, Autor, Datum und Verarbeitungslimits bewahren. H1, H2, H3, Tabellenüberschriften, Code-Sprachmarkierungen und Alternativtexte für Bilder erhalten.'] },
      ],
      faqTitle: 'Häufige Fragen', faqs: [
        { question: 'Warum HTML nicht direkt an einen Agenten senden?', answer: 'HTML enthält oft Navigation, Styles, Skripte und Empfehlungen. Markdown bietet klarere Grenzen für den Kontext.' },
        { question: 'Wozu dient Markdown Viewer?', answer: 'Vor der Übergabe lassen sich Überschriften, Tabellen, Code, Links, Bilder und das Ende prüfen.' },
        { question: 'Kann jede Datei online verarbeitet werden?', answer: 'Nein. Sensible Dateien, gescannte PDFs und Bilder sollten bei Bedarf lokal verarbeitet werden.' },
      ],
    },
  },
};

const shellLabels: Record<Language, { blog: string; tools: string; article: string }> = {
  zh: { blog: '博客', tools: '工具中心', article: '文章' },
  en: { blog: 'Blog', tools: 'Tools', article: 'Article' },
  ja: { blog: 'ブログ', tools: 'ツール', article: '記事' },
  es: { blog: 'Blog', tools: 'Herramientas', article: 'Artículo' },
  de: { blog: 'Blog', tools: 'Werkzeuge', article: 'Artikel' },
};

const href = (path: string, language: Language) => language === 'zh' ? path : `${path}?lang=${language}`;
const copyFor = (article: Article, language: Language) => language === 'zh'
  ? article.zh
  : language === 'en'
    ? article.en
    : localizedCopies[language][article.path] || article.en;

export function BlogPage({ language, articlePath }: { language: Language; articlePath?: string }) {
  const labels = shellLabels[language];
  const blogBrand = language === 'zh' ? 'Herdown博客' : language === 'en' ? 'Herdown Blog' : language === 'ja' ? 'Herdownブログ' : language === 'es' ? 'Blog de Herdown' : 'Herdown-Blog';
  const blogIntro = language === 'zh'
    ? '围绕Markdown、AI Agent和资料整理工作流，分享可直接使用的教程。'
    : language === 'en'
      ? 'Practical guides for Markdown, AI agents, and clean material workflows.'
      : language === 'ja'
        ? 'Markdown、AIエージェント、資料整理ワークフローの実用ガイド。'
        : language === 'es'
          ? 'Guías prácticas para Markdown, agentes de IA y materiales limpios.'
          : 'Praktische Anleitungen für Markdown, AI-Agenten und saubere Material-Workflows.';
  const readArticle = language === 'zh' ? '阅读文章' : language === 'en' ? 'Read the article' : language === 'ja' ? '記事を読む' : language === 'es' ? 'Leer el artículo' : 'Artikel lesen';
  if (!articlePath) {
    return (
      <main className="mx-auto w-full max-w-5xl pb-20 pt-8">
        <div className="max-w-3xl">
          <span className="text-xs font-semibold text-emerald-400">{blogBrand}</span>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{labels.blog}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-400">{blogIntro}</p>
        </div>
        <div className="mt-8 grid gap-5">
          {articles.map(article => {
            const copy = copyFor(article, language);
            return (
              <article key={article.path} className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-6 transition hover:border-emerald-500/50">
                <span className="text-xs font-semibold text-emerald-400">{copy.articleLabel}</span>
                <h2 className="mt-3 text-2xl font-bold text-white">{copy.title}</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{copy.intro}</p>
                <p className="mt-3 text-xs text-slate-500">{copy.updated}</p>
                <a href={href(article.path, language)} className="mt-5 inline-flex rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">{readArticle} →</a>
              </article>
            );
          })}
        </div>
      </main>
    );
  }

  const article = articles.find(item => item.path === articlePath) || articles[0];
  const copy = copyFor(article, language);
  return (
    <main className="mx-auto w-full max-w-4xl pb-20 pt-8">
      <nav className="text-sm text-slate-500"><a href={href('/blog', language)} className="text-emerald-300 hover:text-emerald-200">{labels.blog}</a><span className="px-2">/</span>{labels.article}</nav>
      <article className="mt-6">
        <span className="text-xs font-semibold text-emerald-400">{copy.articleLabel}</span>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">{copy.title}</h1>
        <p className="mt-4 text-base leading-8 text-slate-400">{copy.intro}</p>
        <p className="mt-3 text-xs text-slate-500">{copy.updated}</p>
        <div className="mt-10 space-y-9">
          {copy.sections.map(section => (
            <section key={section.heading}>
              <h2 className="text-2xl font-bold text-white">{section.heading}</h2>
              {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-3 text-sm leading-8 text-slate-300">{paragraph}</p>)}
              {section.bullets && <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300">{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          <section>
            <h2 className="text-2xl font-bold text-white">{copy.faqTitle}</h2>
            <div className="mt-4 space-y-4">{copy.faqs.map(item => <section key={item.question} className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-5"><h3 className="text-base font-semibold text-white">{item.question}</h3><p className="mt-2 text-sm leading-7 text-slate-400">{item.answer}</p></section>)}</div>
          </section>
        </div>
      </article>
      <div className="mt-10 border-t border-[#1e293b] pt-5 text-sm"><a href={href('/markdown-tools', language)} className="text-emerald-300 hover:text-emerald-200">{labels.tools} →</a></div>
    </main>
  );
}
