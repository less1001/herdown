export type Language = 'zh' | 'en' | 'ja' | 'es' | 'de';

export const languageLabels: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  es: 'Español',
  de: 'Deutsch',
};

const supportedLanguages: Language[] = ['zh', 'en', 'ja', 'es', 'de'];

const normalizeLanguage = (value: string | null): Language | null => {
  if (!value) return null;
  if (value === 'zh' || value === 'zh-CN' || value.startsWith('zh-')) return 'zh';
  if (value === 'en' || value.startsWith('en-')) return 'en';
  if (value === 'ja' || value.startsWith('ja-')) return 'ja';
  if (value === 'es' || value.startsWith('es-')) return 'es';
  if (value === 'de' || value.startsWith('de-')) return 'de';
  return null;
};

export const getInitialLanguage = (): Language => {
  if (typeof window === 'undefined') return 'zh';
  const requested = normalizeLanguage(new URLSearchParams(window.location.search).get('lang'));
  if (requested) return requested;
  const saved = normalizeLanguage(window.localStorage.getItem('herdown_language'));
  if (saved) return saved;
  const browser = normalizeLanguage(navigator.language);
  return browser || 'en';
};

const zh = {
  single: '转换', crawl: '全站爬取', api: 'API', admin: '管理', mcp: 'MCP', cli: 'CLI', extension: '浏览器插件', skill: 'Skill', upgrade: '升级', login: 'Google登录', logout: '退出登录',
  tools: '工具入口', help: '帮助', docs: '文档', faq: '常见问题',
  heroBadge: '为AI Agent准备AI-ready Markdown', heroTitle: '给AI Agent的高质量资料入口', heroDescription: '把网页、文档和图片转换为AI-ready Markdown，让AI Agent更准确地理解、检索和使用你的资料。', quickExample: '快速体验示例：', article: '网页文章', urlMode: '网页URL链接转换', htmlMode: '直接粘贴HTML源码', urlPlaceholder: '粘贴网页URL...', htmlPlaceholder: '在此粘贴包含HTML源码的文本...', parse: '生成AI Markdown', parsing: '正在解析中...', parseHtml: '解析HTML源码',
  copied: '已复制', copyResult: '复制结果', download: '下载.md', preview: '渲染预览', source: 'Markdown源码', images: '提取图片', noImages: '本文未提取到独立图片', sourceTokens: '原网页HTML估算', markdownTokens: '清洗后Markdown估算', savedContext: '预计节省上下文', estimated: '仅为估算值，实际数量取决于模型',
  extensionZip: '下载插件ZIP',
  docsTitle: 'HerdownDocs', docsSubtitle: '从一条网页链接开始，把干净资料接入你的AI工作流。', quickStart: '快速开始', apiDocs: 'API文档', integrations: '工作流接入', localTools: '本地工具', security: '额度与安全', docsStart: '打开首页，粘贴网页链接，点击转换为Markdown即可。', docsApi: '在API页面创建密钥，然后使用RESTAPI、MCP或CLI。', docsLocal: 'Word、文字型PDF、PPT和Excel可以直接在浏览器中处理，不上传文件。扫描版PDF使用本地Unlimited-OCRSkill。', docsWorkflow: 'Herdown负责把网页、文档和图片整理成干净资料，Dify、Coze、FastGPT或n8n负责后续工作流。',
  faqTitle: '使用前你可能想知道', faqHint: '点击问题即可展开答案', free: '每月1,000次免费解析', noStorage: 'Herdown以实时处理为主，不提供内容托管或知识库服务。',
  language: '中文', languageZh: '中文', languageEn: 'English', github: 'GitHub源码', terms: '服务条款', privacy: '隐私政策', contact: '联系邮箱', home: '首页',
};

const en = {
  single: 'Convert', crawl: 'Site crawl', api: 'API', admin: 'Admin', mcp: 'MCP', cli: 'CLI', extension: 'Browser extension', skill: 'Skill', upgrade: 'Upgrade', login: 'Sign in with Google', logout: 'Sign out',
  tools: 'Tools', help: 'Help', docs: 'Docs', faq: 'FAQ',
  heroBadge: 'AI-ready Markdown for AI agents', heroTitle: 'A high-quality material input for AI agents', heroDescription: 'Turn webpages, documents, and images into AI-ready Markdown, so AI agents can understand, retrieve, and use your materials more accurately.', quickExample: 'Try an example:', article: 'Web article', urlMode: 'Web URL to Markdown', htmlMode: 'Paste HTML source', urlPlaceholder: 'Paste a webpage URL...', htmlPlaceholder: 'Paste HTML source here...', parse: 'Generate AI-ready Markdown', parsing: 'Parsing...', parseHtml: 'Parse HTML source',
  copied: 'Copied', copyResult: 'Copy result', download: 'Download.md', preview: 'Preview', source: 'Markdown source', images: 'Images', noImages: 'No standalone images were extracted', sourceTokens: 'Original HTML estimate', markdownTokens: 'Clean Markdown estimate', savedContext: 'Estimated context saved', estimated: 'Estimate only; actual tokens depend on the model',
  extensionZip: 'Download extension ZIP',
  docsTitle: 'HerdownDocs', docsSubtitle: 'Start with one URL and connect clean materials to your AI workflow.', quickStart: 'Quick start', apiDocs: 'API documentation', integrations: 'Workflow integrations', localTools: 'Local tools', security: 'Quota and security', docsStart: 'Open the homepage, paste a URL, and click Convert to Markdown.', docsApi: 'Create an API key at the API console, then use the RESTAPI, MCP, or CLI.', docsLocal: 'Process Word, text-based PDF, PPT, and Excel directly in the browser without uploading files. Use the local Unlimited-OCRSkill for scanned PDFs.', docsWorkflow: 'Herdown creates clean materials. Dify, Coze, FastGPT, or n8n can handle the workflow that comes next.',
  faqTitle: 'Questions before you start', faqHint: 'Click a question to expand the answer', free: '1,000 free parses per month', noStorage: 'Herdown processes content in real time and does not provide content hosting or a knowledge base.',
  language: 'English', languageZh: '中文', languageEn: 'English', github: 'GitHub source', terms: 'Terms', privacy: 'Privacy', contact: 'Contact email', home: 'Home',
};

const ja = {
  ...en,
  single: '変換', crawl: 'サイト巡回', extension: 'ブラウザ拡張機能', upgrade: 'アップグレード', login: 'Googleでログイン', logout: 'ログアウト', tools: 'ツール', help: 'ヘルプ', docs: 'ドキュメント', faq: 'よくある質問', language: '日本語',
  heroBadge: 'AIエージェント向けMarkdown', heroTitle: 'AIエージェントのための高品質な資料入口', heroDescription: 'Webページ、文書、画像をAIエージェントが扱いやすいMarkdownに変換します。', quickExample: 'サンプルを試す:', article: 'Web記事', urlMode: 'WebURLをMarkdownへ', htmlMode: 'HTMLソースを貼り付け', urlPlaceholder: 'WebページのURLを貼り付け...', htmlPlaceholder: 'HTMLソースを貼り付け...', parse: 'AI向けMarkdownを生成', parsing: '解析中...', parseHtml: 'HTMLソースを解析', copied: 'コピーしました', copyResult: '結果をコピー', download: 'Markdownをダウンロード', preview: 'プレビュー', source: 'Markdownソース', images: '抽出画像', noImages: '独立した画像はありません',
  docsTitle: 'HerdownDocs', docsSubtitle: '1つのURLから始めて、整った資料をAIワークフローへ接続します。', quickStart: 'クイックスタート', apiDocs: 'APIドキュメント', integrations: 'ワークフロー連携', localTools: 'ローカルツール', security: '利用枠と安全性', docsStart: 'トップページでURLを貼り付け、Markdownへ変換をクリックします。', docsApi: 'API画面でキーを作成し、RESTAPI、MCP、CLIを利用します。', docsLocal: 'Word、テキストPDF、PPT、Excelはアップロードせずブラウザで処理できます。スキャンPDFはローカルのUnlimited-OCRSkillを使います。', docsWorkflow: 'Herdownは資料を整え、Dify、Coze、FastGPT、n8nなどが次のワークフローを担当します。', faqTitle: '利用前に知っておきたいこと', faqHint: '質問をクリックすると回答が開きます', free: '毎月1,000回まで無料', noStorage: 'Herdownはリアルタイム処理を行い、コンテンツ保管やナレッジベースを提供しません。',
};

const es = {
  ...en,
  single: 'Convertir', crawl: 'Rastreo del sitio', extension: 'Extensión del navegador', upgrade: 'Actualizar', login: 'Iniciar con Google', logout: 'Cerrar sesión', tools: 'Herramientas', help: 'Ayuda', docs: 'Documentación', faq: 'Preguntas frecuentes', language: 'Español',
  heroBadge: 'Markdown listo para agentes de IA', heroTitle: 'Una entrada de materiales de alta calidad para agentes de IA', heroDescription: 'Convierte páginas web, documentos e imágenes en Markdown listo para que los agentes de IA lo entiendan y utilicen.', quickExample: 'Prueba un ejemplo:', article: 'Artículo web', urlMode: 'URL web a Markdown', htmlMode: 'Pegar código HTML', urlPlaceholder: 'Pega una URL...', htmlPlaceholder: 'Pega aquí el HTML...', parse: 'Generar Markdown para IA', parsing: 'Analizando...', parseHtml: 'Analizar HTML', copied: 'Copiado', copyResult: 'Copiar resultado', download: 'Descargar Markdown', preview: 'Vista previa', source: 'Código Markdown', images: 'Imágenes', noImages: 'No se extrajeron imágenes independientes',
  docsTitle: 'HerdownDocs', docsSubtitle: 'Empieza con una URL y conecta materiales limpios a tu flujo de IA.', quickStart: 'Inicio rápido', apiDocs: 'Documentación API', integrations: 'Integraciones', localTools: 'Herramientas locales', security: 'Cuota y seguridad', docsStart: 'Abre la página principal, pega una URL y pulsa Convertir a Markdown.', docsApi: 'Crea una clave en la consola API y usa RESTAPI, MCP o CLI.', docsLocal: 'Procesa Word, PDF de texto, PPT y Excel en el navegador sin subir archivos. Para PDF escaneado usa Unlimited-OCRSkill local.', docsWorkflow: 'Herdown prepara materiales limpios. Dify, Coze, FastGPT o n8n pueden continuar el flujo.', faqTitle: 'Preguntas antes de empezar', faqHint: 'Pulsa una pregunta para abrir la respuesta', free: '1.000 análisis gratuitos al mes', noStorage: 'Herdown procesa el contenido en tiempo real y no ofrece alojamiento de contenido ni base de conocimiento.',
};

const de = {
  ...en,
  single: 'Konvertieren', crawl: 'Website-Crawl', extension: 'Browser-Erweiterung', upgrade: 'Upgrade', login: 'Mit Google anmelden', logout: 'Abmelden', tools: 'Werkzeuge', help: 'Hilfe', docs: 'Dokumentation', faq: 'FAQ', language: 'Deutsch',
  heroBadge: 'AI-fertiges Markdown für AI-Agenten', heroTitle: 'Hochwertiger Materialeingang für AI-Agenten', heroDescription: 'Webseiten, Dokumente und Bilder werden in Markdown umgewandelt, das AI-Agenten besser verstehen und nutzen können.', quickExample: 'Beispiel testen:', article: 'Webartikel', urlMode: 'Web-URL zu Markdown', htmlMode: 'HTML-Quelltext einfügen', urlPlaceholder: 'Webseiten-URL einfügen...', htmlPlaceholder: 'HTML-Quelltext hier einfügen...', parse: 'AI-Markdown erzeugen', parsing: 'Wird analysiert...', parseHtml: 'HTML analysieren', copied: 'Kopiert', copyResult: 'Ergebnis kopieren', download: 'Markdown laden', preview: 'Vorschau', source: 'Markdown-Quelltext', images: 'Bilder', noImages: 'Keine eigenständigen Bilder extrahiert',
  docsTitle: 'HerdownDocs', docsSubtitle: 'Mit einer URL beginnen und saubere Materialien an den AI-Workflow anschließen.', quickStart: 'Schnellstart', apiDocs: 'API-Dokumentation', integrations: 'Workflow-Integrationen', localTools: 'Lokale Werkzeuge', security: 'Kontingent und Sicherheit', docsStart: 'Startseite öffnen, URL einfügen und In Markdown konvertieren klicken.', docsApi: 'API-Schlüssel in der Konsole erstellen und RESTAPI, MCP oder CLI verwenden.', docsLocal: 'Word, textbasierte PDFs, PPT und Excel werden ohne Upload im Browser verarbeitet. Für gescannte PDFs das lokale Unlimited-OCRSkill verwenden.', docsWorkflow: 'Herdown erstellt saubere Materialien. Dify, Coze, FastGPT oder n8n führen den Workflow fort.', faqTitle: 'Fragen vor dem Start', faqHint: 'Frage anklicken, um die Antwort zu öffnen', free: '1.000 kostenlose Analysen pro Monat', noStorage: 'Herdown verarbeitet Inhalte in Echtzeit und bietet keine Inhaltsablage oder Wissensdatenbank.',
};

export const messages = { zh, en, ja, es, de };
export const availableLanguages = supportedLanguages;
export type Messages = typeof messages.zh;

export type HomeCopy = {
  heroBadge: string;
  heroTitle: string;
  heroDescription: string;
  generate: string;
  quotaNote: string;
  cleanContextTitle: string;
  cleanContextSubtitle: string;
  cleanContextFeatures: Array<{ title: string; body: string }>;
  faqTitle: string;
  faqItems: Array<{ question: string; answer: string }>;
  freePlan: string;
  freePlanSuffix: string;
  languageLabel: string;
  developers: string;
  signIn: string;
};

export const homeMessages: Record<Language, HomeCopy> = {
  zh: {
    heroBadge: '为AI Agent准备高质量Markdown',
    heroTitle: '给AI Agent的高质量Markdown资料入口',
    heroDescription: '把网页、文档和图片转换为适合AI Agent理解、检索和使用的高质量Markdown。',
    generate: '生成AI Markdown',
    quotaNote: '每月1,000次免费网页解析：首页和API共用额度；未使用点数时每日最多20次解析请求，全站抓取单次最多5页并按页面计数。',
    cleanContextTitle: '为什么AI Agent需要干净上下文',
    cleanContextSubtitle: '减少无效信息，给Agent更高质量的资料。',
    cleanContextFeatures: [
      { title: '减少无效上下文', body: '清理HTML、广告、导航和推荐内容，减少无效上下文，也通常意味着更少的输入Token和更低的调用成本。' },
      { title: '提高Agent理解能力', body: '结构化Markdown让AI Agent更容易检索、理解和使用资料。' },
      { title: '降低成本，加快响应', body: '更少的输入Token通常意味着更低的模型调用成本、更快的响应速度和更多有效上下文空间。' },
    ],
    faqTitle: '常见问题',
    faqItems: [
      { question: 'Herdown是做什么的？', answer: '把网页链接或HTML整理成更干净的Markdown，方便保存、阅读、交给AI工作流或知识库继续使用。' },
      { question: '我提交的内容会被长期保存吗？', answer: '不会。Herdown以实时处理为主，不提供内容托管或知识库服务。必要的短期技术日志仅用于安全防护、稳定性和故障排查。' },
      { question: '不会写代码也能用吗？', answer: '可以。直接粘贴网页链接并点击转换即可。开发者也可以通过API、MCP、CLI或浏览器插件接入自己的工作流。' },
      { question: '为什么有些网页无法解析？', answer: '登录限制、付费墙、反爬机制和动态加载都可能影响结果。你可以尝试粘贴已打开页面的HTML源码，或使用浏览器插件在本地提取。' },
      { question: '点数包如何计费？会自动续费吗？', answer: '收银台会明确展示金额、包含额度和支付方式。Herdown目前只提供一次性点数包，不会自动续费。' },
      { question: '哪些内容不能提交？', answer: '请只处理你有权访问和使用的内容。不要用于绕过访问限制、抓取私人数据、侵犯版权或违反第三方平台规则。' },
    ],
    freePlan: '免费体验',
    freePlanSuffix: '；也可以选择一次性点数包，点数不过期，不自动续费。',
    languageLabel: '语言',
    developers: '开发者',
    signIn: '登录',
  },
  en: {
    heroBadge: 'AI-ready Markdown for AI agents',
    heroTitle: 'A high-quality Markdown input for AI agents',
    heroDescription: 'Turn webpages, documents, and images into AI-ready Markdown, so AI agents can understand, retrieve, and use your materials more accurately.',
    generate: 'Generate AI-ready Markdown',
    quotaNote: '1,000 free webpage parses per month shared by the homepage and API. Without purchased credits, parsing requests are limited to 20 per day; each site crawl request can process up to 5 pages.',
    cleanContextTitle: 'Why AI agents need clean context',
    cleanContextSubtitle: 'Less noise in, better material for the agent.',
    cleanContextFeatures: [
      { title: 'Reduce Context Waste', body: 'Remove HTML noise, ads, navigation, and recommendations. Less unnecessary context usually means fewer input tokens and lower API costs.' },
      { title: 'Better Agent Understanding', body: 'Structured Markdown makes it easier for AI agents to retrieve, understand, and use your materials.' },
      { title: 'Lower Cost, Faster Responses', body: 'Fewer input tokens usually mean lower model costs, faster responses, and more useful context space.' },
    ],
    faqTitle: 'FAQ',
    faqItems: [
      { question: 'What does Herdown do?', answer: 'Herdown turns webpages or HTML into clean Markdown for saving, reading, AI workflows, and knowledge tools.' },
      { question: 'Is my content stored long-term?', answer: 'No. Herdown processes content in real time and does not host your content or run a knowledge base. Limited technical logs may be used for security and troubleshooting.' },
      { question: 'Can I use it without coding?', answer: 'Yes. Paste a URL and click Convert. Developers can also use the API, MCP, CLI, or browser extension.' },
      { question: 'Why can some pages not be parsed?', answer: 'Login walls, paywalls, anti-bot rules, and dynamic loading can affect results. Try pasting the page HTML or use the browser extension locally.' },
      { question: 'How are credits billed? Do they renew?', answer: 'The checkout shows the price, included credits, and payment method. Herdown only offers one-time credit packs and does not auto-renew.' },
      { question: 'What content must not be submitted?', answer: 'Only process content you are allowed to access and use. Do not bypass access controls, scrape private data, infringe copyright, or violate platform rules.' },
    ],
    freePlan: 'Free plan',
    freePlanSuffix: '. One-time credit packs do not expire and do not auto-renew.',
    languageLabel: 'Language',
    developers: 'Developers',
    signIn: 'Sign in',
  },
  ja: {
    heroBadge: 'AIエージェント向けの高品質Markdown',
    heroTitle: 'AIエージェントのための高品質Markdown資料入口',
    heroDescription: 'Webページ、文書、画像をAIエージェントが理解、検索、利用しやすい高品質Markdownに変換します。',
    generate: 'AI向けMarkdownを生成',
    quotaNote: 'トップページとAPIで月1,000回の無料解析を共有します。クレジット未購入時は1日20回まで、サイト巡回は1回5ページまでです。',
    cleanContextTitle: 'AIエージェントにクリーンなコンテキストが必要な理由',
    cleanContextSubtitle: '不要な情報を減らし、エージェントが使いやすい資料を作ります。',
    cleanContextFeatures: [
      { title: '不要なコンテキストを削減', body: 'HTMLのノイズ、広告、ナビゲーション、推薦情報を整理し、入力トークンとAPIコストを抑えます。' },
      { title: 'エージェントの理解を改善', body: '構造化されたMarkdownにより、AIエージェントが資料を検索、理解、利用しやすくなります。' },
      { title: 'コストを下げて応答を高速化', body: '入力トークンを減らすことで、モデルコストを抑え、応答を速くし、使えるコンテキストを増やせます。' },
    ],
    faqTitle: 'よくある質問',
    faqItems: [
      { question: 'Herdownは何をするサービスですか？', answer: 'WebページやHTMLを保存、読解、AIワークフロー、ナレッジツールで使いやすいクリーンなMarkdownに整えます。' },
      { question: '送信した内容は長期保存されますか？', answer: 'いいえ。Herdownはリアルタイム処理を行い、コンテンツ保管やナレッジベースを提供しません。必要最小限の技術ログは安全性と障害対応に使われます。' },
      { question: 'コードを書けなくても使えますか？', answer: 'はい。URLを貼り付けて変換をクリックするだけです。開発者はAPI、MCP、CLI、ブラウザ拡張機能も利用できます。' },
      { question: '解析できないページがあるのはなぜですか？', answer: 'ログイン制限、ペイウォール、ボット対策、動的読み込みが結果に影響する場合があります。HTMLを貼り付けるか、ブラウザ拡張機能を試してください。' },
      { question: 'クレジットはどのように請求されますか？自動更新されますか？', answer: '決済画面に価格、クレジット、支払い方法を表示します。Herdownは一回購入型のクレジットのみで、自動更新はありません。' },
      { question: '送信してはいけない内容はありますか？', answer: 'アクセスと利用の権限がある内容だけを処理してください。アクセス制御の回避、個人データの収集、著作権侵害、規約違反には使わないでください。' },
    ],
    freePlan: '無料プラン',
    freePlanSuffix: '。一回購入型のクレジットは期限切れにならず、自動更新もありません。',
    languageLabel: '言語',
    developers: '開発者',
    signIn: 'ログイン',
  },
  es: {
    heroBadge: 'Markdown listo para agentes de IA',
    heroTitle: 'Una entrada de Markdown de alta calidad para agentes de IA',
    heroDescription: 'Convierte páginas web, documentos e imágenes en Markdown de alta calidad para que los agentes de IA puedan entenderlos, buscarlos y utilizarlos mejor.',
    generate: 'Generar Markdown para IA',
    quotaNote: 'La página principal y la API comparten 1.000 análisis web gratuitos al mes. Sin créditos comprados, hay un máximo de 20 solicitudes al día y cada rastreo procesa hasta 5 páginas.',
    cleanContextTitle: 'Por qué los agentes de IA necesitan un contexto limpio',
    cleanContextSubtitle: 'Menos ruido y materiales más útiles para el agente.',
    cleanContextFeatures: [
      { title: 'Reducir el contexto innecesario', body: 'Elimina ruido HTML, anuncios, navegación y recomendaciones. Menos contexto innecesario suele significar menos tokens de entrada y menor coste de API.' },
      { title: 'Mejorar la comprensión del agente', body: 'El Markdown estructurado facilita que los agentes de IA busquen, entiendan y utilicen tus materiales.' },
      { title: 'Menor coste y respuestas más rápidas', body: 'Menos tokens de entrada suelen significar menor coste del modelo, respuestas más rápidas y más espacio de contexto útil.' },
    ],
    faqTitle: 'Preguntas frecuentes',
    faqItems: [
      { question: '¿Qué hace Herdown?', answer: 'Herdown convierte páginas web o HTML en Markdown limpio para guardar, leer y utilizar en flujos de IA y herramientas de conocimiento.' },
      { question: '¿Se guarda mi contenido a largo plazo?', answer: 'No. Herdown procesa el contenido en tiempo real y no aloja tu contenido ni mantiene una base de conocimiento. Los registros técnicos mínimos se usan para seguridad y diagnóstico.' },
      { question: '¿Puedo usarlo sin programar?', answer: 'Sí. Pega una URL y pulsa Convertir. Los desarrolladores también pueden usar la API, MCP, CLI o la extensión del navegador.' },
      { question: '¿Por qué algunas páginas no se pueden analizar?', answer: 'Los inicios de sesión, muros de pago, sistemas antibot y cargas dinámicas pueden afectar al resultado. Prueba a pegar el HTML o usa la extensión local.' },
      { question: '¿Cómo se cobran los créditos? ¿Se renuevan?', answer: 'La pantalla de pago muestra el precio, los créditos incluidos y el método de pago. Herdown solo ofrece paquetes de créditos de un solo pago y no renueva automáticamente.' },
      { question: '¿Qué contenido no debo enviar?', answer: 'Procesa solo contenido al que tengas derecho de acceso y uso. No evadas controles de acceso, recopiles datos privados, infrinjas derechos de autor ni incumplas reglas de terceros.' },
    ],
    freePlan: 'Plan gratuito',
    freePlanSuffix: '. Los paquetes de créditos de un solo pago no caducan ni se renuevan automáticamente.',
    languageLabel: 'Idioma',
    developers: 'Desarrolladores',
    signIn: 'Iniciar sesión',
  },
  de: {
    heroBadge: 'Sauberes Markdown für AI-Agenten',
    heroTitle: 'Hochwertiger Markdown-Eingang für AI-Agenten',
    heroDescription: 'Webseiten, Dokumente und Bilder in hochwertiges Markdown umwandeln, das AI-Agenten besser verstehen, durchsuchen und nutzen können.',
    generate: 'AI-Markdown erzeugen',
    quotaNote: 'Startseite und API teilen sich 1.000 kostenlose Webseitenanalysen pro Monat. Ohne gekaufte Credits sind 20 Anfragen pro Tag möglich, jeder Website-Crawl verarbeitet bis zu 5 Seiten.',
    cleanContextTitle: 'Warum AI-Agenten sauberen Kontext brauchen',
    cleanContextSubtitle: 'Weniger Rauschen und besser nutzbares Material für den Agenten.',
    cleanContextFeatures: [
      { title: 'Unnötigen Kontext reduzieren', body: 'HTML-Rauschen, Werbung, Navigation und Empfehlungen entfernen. Weniger unnötiger Kontext bedeutet oft weniger Eingabe-Tokens und geringere API-Kosten.' },
      { title: 'Das Verständnis des Agenten verbessern', body: 'Strukturiertes Markdown macht es AI-Agenten leichter, Materialien zu suchen, zu verstehen und zu verwenden.' },
      { title: 'Kosten senken und Antworten beschleunigen', body: 'Weniger Eingabe-Tokens bedeuten meist geringere Modellkosten, schnellere Antworten und mehr nutzbaren Kontext.' },
    ],
    faqTitle: 'Häufige Fragen',
    faqItems: [
      { question: 'Was macht Herdown?', answer: 'Herdown wandelt Webseiten oder HTML in sauberes Markdown zum Speichern, Lesen und für AI-Workflows und Wissenswerkzeuge um.' },
      { question: 'Wird mein Inhalt langfristig gespeichert?', answer: 'Nein. Herdown verarbeitet Inhalte in Echtzeit und bietet keine Inhaltsablage oder Wissensdatenbank. Minimale technische Protokolle dienen Sicherheit und Fehleranalyse.' },
      { question: 'Kann ich es ohne Programmierkenntnisse nutzen?', answer: 'Ja. URL einfügen und auf Konvertieren klicken. Entwickler können zusätzlich API, MCP, CLI oder die Browser-Erweiterung nutzen.' },
      { question: 'Warum können manche Seiten nicht analysiert werden?', answer: 'Anmeldepflichten, Bezahlschranken, Bot-Schutz und dynamisches Laden können das Ergebnis beeinflussen. HTML einfügen oder die lokale Browser-Erweiterung verwenden.' },
      { question: 'Wie werden Credits abgerechnet? Verlängern sie sich?', answer: 'Die Kasse zeigt Preis, enthaltene Credits und Zahlungsmethode. Herdown bietet nur einmalige Credit-Pakete ohne automatische Verlängerung.' },
      { question: 'Welche Inhalte dürfen nicht eingereicht werden?', answer: 'Nur Inhalte verarbeiten, auf die du zugreifen und die du nutzen darfst. Keine Zugriffskontrollen umgehen, privaten Daten sammeln, Urheberrechte verletzen oder Regeln Dritter brechen.' },
    ],
    freePlan: 'Kostenloser Tarif',
    freePlanSuffix: '. Einmalige Credit-Pakete verfallen nicht und verlängern sich nicht automatisch.',
    languageLabel: 'Sprache',
    developers: 'Entwickler',
    signIn: 'Anmelden',
  },
};
