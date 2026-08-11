type SeoLanguage = 'ja' | 'es' | 'de';

type SeoPage = {
  title: string;
  description: string;
  keywords: string;
  heading: string;
  intro: string;
};

type Entry = [string, string, string, string];

const data: Record<SeoLanguage, Entry[]> = {
  ja: [
    ['/', 'AIエージェント向け高品質Markdown', 'Webページ、文書、画像を高品質Markdownに変換し、ローカル処理、API、MCP、CLI、ブラウザ拡張機能へ接続できます。', 'WebページMarkdown,文書Markdown,AIエージェント,Markdown変換,API,MCP,CLI'],
    ['/tools', 'ローカル文書Markdown変換ツール', 'Word、PDF、PPT、Excel、CSV、JSON、XML、RTF、Markdownをブラウザ内で変換し、確認して保存します。', 'ローカル文書変換,文書Markdown,PDFMarkdown,ExcelMarkdown'],
    ['/about', 'Herdownについて', 'Herdownの製品方針、ローカル優先の処理、開発者向け入口を紹介します。', 'Herdownについて,ローカルMarkdown,Markdownツール'],
    ['/contact', 'Herdownへのお問い合わせ', '変換結果、ページ動作、プライバシー、開発者連携についてお問い合わせください。', 'Herdownお問い合わせ,Markdown変換サポート,Herdownサポート'],
    ['/url-to-markdown', '無料URLからMarkdownへ変換', '無料URLからMarkdown変換で公開Webページを1つ処理し、本文、タイトル、画像、出典を確認して保存します。', 'URL Markdown,WebページMarkdown,HTML Markdown,無料URL変換'],
    ['/website-to-markdown', 'WebサイトからMarkdownへ', 'ドメイン、開始URL、Sitemapから複数の公開ページを巡回し、出典URLを残してMarkdownまたはZIPに出力します。', 'WebサイトMarkdown,Webサイト巡回,Markdown変換'],
    ['/txt-to-markdown', 'TXTをMarkdownへ', 'プレーンテキストを保存、編集、AI入力に使えるMarkdownへ変換します。', 'TXT Markdown,テキストMarkdown,Markdown変換'],
    ['/pdf-to-markdown', 'PDFからMarkdownへ', 'テキストPDFをアップロードせずMarkdownに変換します。スキャンPDFはローカルOCRを使います。', 'PDF Markdown,PDFからMD,テキストPDF変換'],
    ['/word-to-markdown', 'WordからMarkdownへ', 'WordとDOCX文書をブラウザ内で構造化Markdownに変換します。', 'Word Markdown,DOCX Markdown,文書Markdown'],
    ['/ppt-to-markdown', 'PPTからMarkdownへ', 'PowerPointとPPTXのスライド文字をブラウザ内でMarkdownに整えます。', 'PPT Markdown,PPTX Markdown,プレゼンMarkdown'],
    ['/excel-to-markdown', 'ExcelからMarkdownへ変換', 'XLSXワークシートをブラウザ内で読みやすいMarkdown表に変換し、形式の制限を確認して保存します。', 'Excel Markdown,XLSX Markdown,表計算Markdown,Excel変換'],
    ['/csv-to-markdown', 'CSVからMarkdownへ', 'CSVやTSVをブラウザ内でMarkdown表に変換し、コピーまたはダウンロードできます。', 'CSV Markdown,TSV Markdown,Markdown表'],
    ['/json-to-markdown', 'JSONからMarkdownへ', 'JSONのオブジェクト、配列、ネスト構造を読みやすいMarkdownに変換します。', 'JSON Markdown,JSONからMD,JSON表'],
    ['/xml-to-markdown', 'XMLからMarkdownへ', 'Sitemap、RSS、Atom、一般的なXMLをMarkdownとして読みやすく表示します。', 'XML Markdown,Sitemap Markdown,RSS Markdown'],
    ['/rtf-to-markdown', 'RTFからMarkdownへ', 'RTFから段落、Unicode文字、改行、基本リストを抽出してMarkdownにします。', 'RTF Markdown,RTFからMD,RTF抽出'],
    ['/paste-to-markdown', '貼り付けからMarkdownへ', 'リッチテキスト、HTML、プレーンテキストをブラウザ内でMarkdownに変換します。', '貼り付けMarkdown,HTML Markdown,リッチテキスト変換'],
    ['/notion-to-markdown', 'NotionからMarkdownへ', '公開NotionページまたはHTMLエクスポートをMarkdownに変換します。', 'Notion Markdown,Notionページ変換,Notion HTML'],
    ['/google-docs-to-markdown', 'Google DocsからMarkdownへ', '公開Google DocsまたはHTMLエクスポートをMarkdownに変換します。', 'Google Docs Markdown,Google Docs変換,HTMLエクスポート'],
    ['/markdown-to-html', 'MarkdownからHTMLへ', 'Markdownを公開、保存、編集できる独立HTMLファイルに変換します。', 'Markdown HTML,Markdown変換,HTMLエクスポート'],
    ['/markdown-to-pdf', 'MarkdownからPDFへ', 'MarkdownをA4PDFに整え、見出し、表、コード、リンクを読みやすく保ちます。', 'Markdown PDF,Markdown変換,PDFエクスポート'],
    ['/markdown-to-word', 'MarkdownからWordへ', 'Markdownを編集可能なDOCXに変換し、納品やレビューに使えます。', 'Markdown Word,Markdown DOCX,DOCXエクスポート'],
    ['/markdown-to-csv', 'MarkdownからCSVへ', 'Markdown表を抽出してCSVとしてダウンロードします。', 'Markdown CSV,Markdown表CSV,CSVエクスポート'],
    ['/markdown-viewer', 'Markdownビューア｜MDファイルを開く', 'ローカルの.mdファイルを開き、リアルタイムプレビュー、HTML、PDF出力を利用できます。', 'Markdown Viewer,MDファイルビューア,Markdownプレビュー'],
    ['/markdown-to-wechat', 'MarkdownからWeChat記事へ', 'MarkdownをWeChatエディターに貼り付けられるリッチテキストに整えます。', 'Markdown WeChat,WeChat記事,Markdown公開'],
    ['/markdown-to-xiaohongshu', 'MarkdownからXiaohongshuカードへ', 'Markdownをテーマと比率を選べるXiaohongshu画像カードに変換します。', 'Markdown Xiaohongshu,画像カード,Markdown画像'],
    ['/markdown-tools', 'Markdownツール｜表示、変換、公開', 'Markdownの表示、変換、WeChatとXiaohongshu向け公開ツールをまとめています。', 'Markdownツール,Markdown Viewer,Markdown変換'],
    ['/markdown-format-guide', 'Markdown形式ガイド', '編集、納品、公開の目的に合わせてMarkdownの出力形式を選べます。', 'Markdown形式,Markdown HTML,Markdown PDF'],
    ['/merge-documents', '文書結合ツール｜PDF、DOCX、PPTX、Excel', 'PDF、DOCX、PPTX、Excelを形式別に選び、ブラウザ内で結合できます。', '文書結合,PDF結合,DOCX結合,PPTX結合'],
    ['/merge-pdf', 'PDF結合｜PDFファイルを結合', '複数のPDFを順番どおり1つに結合します。ファイルはブラウザ内で処理されます。', 'PDF結合,PDFファイル結合,PDFマージ'],
    ['/merge-docx', 'DOCX結合｜Word文書を結合', '複数のDOCXを結合し、可能な限り書式、表、画像、リストを保持します。', 'DOCX結合,Word文書結合,DOCXマージ'],
    ['/merge-pptx', 'PPTX結合｜PowerPointを結合', '複数のPPTXを結合し、スライド、画像、レイアウト関係を保ちます。', 'PPTX結合,PowerPoint結合,PPTXマージ'],
    ['/merge-excel', 'Excel結合｜ファイルとシートを結合', '複数のExcelを1つのブックに結合し、シートまたは追加モードを選べます。', 'Excel結合,Excelファイル結合,Excelシート結合'],
    ['/sitemap-extractor', 'SitemapURL抽出｜URLリストを取得', 'Sitemapを発見、SitemapIndexを展開し、重複のないURLをTXT、CSV、Markdownで出力します。', 'Sitemap抽出,SitemapURL抽出,URLリスト'],
    ['/sitemap-checker', 'Sitemapチェッカー｜Sitemapを検索して確認', 'robots.txtと一般的な場所からSitemapを探し、XML構造、URL数、重複を確認します。', 'Sitemap checker,Sitemap検索,Sitemap確認'],
    ['/sitemap-validator', 'Sitemapバリデーター｜XMLを検証', 'Sitemap XMLの構文、プロトコル項目、重複URL、サイズ制限を検証します。', 'Sitemap validator,Sitemap XML検証,XML検証'],
    ['/sitemap-generator', 'XMLSitemapジェネレーター', '公開サイトをクロールするかURLを貼り付け、標準sitemap.xmlを生成します。', 'Sitemap generator,XML Sitemap生成,Sitemap作成'],
    ['/website-url-extractor', 'WebサイトURL抽出｜内部リンクを取得', '同一サイトの公開HTMLリンクをクロールし、状態、タイトル、深さとURLリストを確認します。', 'WebサイトURL抽出,内部リンク,URLクローラー'],
    ['/docs', 'WebからMarkdownへの開発者ドキュメント', 'HerdownのWebからMarkdownへのワークフローをREST API、MCP、CLI、Skill、ブラウザ拡張機能で接続します。', 'Herdownドキュメント,REST API,MCP,CLI,Web Markdown'],
    ['/help', 'Herdownヘルプセンター', 'Web変換、ローカルファイル、アカウント、クレジット、データ処理について確認できます。', 'Herdownヘルプ,利用ガイド,データ処理'],
    ['/faq', 'Herdownよくある質問', '解析範囲、データ保存、無料枠、ローカル文書処理について回答します。', 'Herdown FAQ,Web解析,無料枠'],
    ['/api', 'Herdown APIコンソール', 'Herdown APIキーを作成、管理し、使用量と解析枠を確認できます。', 'Herdown API,APIキー,Markdown API'],
    ['/mcp', 'Herdown MCP連携', 'MCPクライアントからHerdownのWeb解析とサイト巡回を利用できます。', 'Herdown MCP,MCPサーバー,AIエージェント'],
    ['/cli', 'Herdown CLIコマンドラインツール', 'ターミナルからHerdownを実行し、WebページをMarkdownファイルに保存できます。', 'Herdown CLI,URL Markdown,コマンドライン'],
    ['/skill', 'Herdown Skill｜AIエージェントワークフロー', 'Herdown Skillで公開URL、ローカルファイル、API、MCP、CLI、ブラウザ抽出、OCRを使い分けます。', 'Herdown Skill,AIエージェント,Markdown,ワークフロー'],
    ['/pricing', 'Web解析の料金とクレジット｜Herdown', 'HerdownのWeb解析無料枠、日次ルール、一回購入型クレジットを確認してMarkdownワークフローを始めます。', 'Herdown料金,解析クレジット,無料枠,Web解析'],
    ['/browser-extension', 'ローカルWebからMarkdownへのブラウザ拡張機能', '現在の描画ページをブラウザ内で抽出し、確認してクリーンなMarkdownとして保存します。', 'ブラウザ拡張機能,Webクリップ,Markdown,ローカル抽出'],
  ],
  es: [],
  de: [],
};

const translatedNames: Record<Exclude<SeoLanguage, 'ja'>, Record<string, string>> = {
  es: {
    '/about': 'Sobre Herdown', '/contact': 'Contactar con Herdown', '/website-to-markdown': 'De sitio web a Markdown',
    '/': 'Markdown limpio para agentes de IA', '/tools': 'Herramientas de materiales locales', '/url-to-markdown': 'URL a Markdown', '/txt-to-markdown': 'TXT a Markdown', '/pdf-to-markdown': 'PDF a Markdown', '/word-to-markdown': 'Word a Markdown', '/ppt-to-markdown': 'PPT a Markdown', '/excel-to-markdown': 'Excel a Markdown', '/csv-to-markdown': 'CSV a Markdown', '/json-to-markdown': 'JSON a Markdown', '/xml-to-markdown': 'XML a Markdown', '/rtf-to-markdown': 'RTF a Markdown', '/paste-to-markdown': 'Pegado a Markdown', '/notion-to-markdown': 'Notion a Markdown', '/google-docs-to-markdown': 'Google Docs a Markdown', '/markdown-to-html': 'Markdown a HTML', '/markdown-to-pdf': 'Markdown a PDF', '/markdown-to-word': 'Markdown a Word', '/markdown-to-csv': 'Markdown a CSV', '/markdown-viewer': 'Visor Markdown: abrir archivos MD', '/markdown-to-wechat': 'Markdown a WeChat', '/markdown-to-xiaohongshu': 'Markdown a Xiaohongshu', '/markdown-tools': 'Herramientas Markdown', '/markdown-format-guide': 'Guía de formatos Markdown', '/merge-documents': 'Herramientas para unir documentos', '/merge-pdf': 'Unir PDF', '/merge-docx': 'Unir DOCX', '/merge-pptx': 'Unir PPTX', '/merge-excel': 'Unir Excel', '/sitemap-extractor': 'Extractor de URLs de Sitemap', '/sitemap-checker': 'Comprobador de Sitemap', '/sitemap-validator': 'Validador de Sitemap', '/sitemap-generator': 'Generador de Sitemap XML', '/website-url-extractor': 'Extractor de URLs web', '/docs': 'Documentación para desarrolladores', '/help': 'Centro de ayuda de Herdown', '/faq': 'Preguntas frecuentes de Herdown', '/api': 'Consola API de Herdown', '/mcp': 'Integración MCP de Herdown', '/cli': 'Herramienta CLI de Herdown', '/skill': 'Herdown Skill para agentes de IA', '/pricing': 'Precios y créditos de Herdown', '/browser-extension': 'Extensión del navegador de Herdown',
  },
  de: {
    '/about': 'Über Herdown', '/contact': 'Herdown kontaktieren', '/website-to-markdown': 'Website zu Markdown',
    '/': 'Sauberes Markdown für AI-Agenten', '/tools': 'Werkzeuge für lokale Materialien', '/url-to-markdown': 'URL zu Markdown', '/txt-to-markdown': 'TXT zu Markdown', '/pdf-to-markdown': 'PDF zu Markdown', '/word-to-markdown': 'Word zu Markdown', '/ppt-to-markdown': 'PPT zu Markdown', '/excel-to-markdown': 'Excel zu Markdown', '/csv-to-markdown': 'CSV zu Markdown', '/json-to-markdown': 'JSON zu Markdown', '/xml-to-markdown': 'XML zu Markdown', '/rtf-to-markdown': 'RTF zu Markdown', '/paste-to-markdown': 'Einfügen zu Markdown', '/notion-to-markdown': 'Notion zu Markdown', '/google-docs-to-markdown': 'Google Docs zu Markdown', '/markdown-to-html': 'Markdown zu HTML', '/markdown-to-pdf': 'Markdown zu PDF', '/markdown-to-word': 'Markdown zu Word', '/markdown-to-csv': 'Markdown zu CSV', '/markdown-viewer': 'Markdown-Viewer: MD-Dateien öffnen', '/markdown-to-wechat': 'Markdown zu WeChat', '/markdown-to-xiaohongshu': 'Markdown zu Xiaohongshu', '/markdown-tools': 'Markdown-Werkzeuge', '/markdown-format-guide': 'Markdown-Formatleitfaden', '/merge-documents': 'Dokumente zusammenführen', '/merge-pdf': 'PDF zusammenführen', '/merge-docx': 'DOCX zusammenführen', '/merge-pptx': 'PPTX zusammenführen', '/merge-excel': 'Excel zusammenführen', '/sitemap-extractor': 'Sitemap-URL-Extraktor', '/sitemap-checker': 'Sitemap-Prüfer', '/sitemap-validator': 'Sitemap-Validator', '/sitemap-generator': 'XML-Sitemap-Generator', '/website-url-extractor': 'Website-URL-Extraktor', '/docs': 'Entwicklerdokumentation', '/help': 'Herdown-Hilfezentrum', '/faq': 'Herdown-Häufige Fragen', '/api': 'Herdown-API-Konsole', '/mcp': 'Herdown-MCP-Integration', '/cli': 'Herdown-CLI-Tool', '/skill': 'Herdown Skill für AI-Agenten', '/pricing': 'Herdown-Preise und Credits', '/browser-extension': 'Herdown-Browser-Erweiterung',
  },
};

const esDescriptions: Record<string, string> = {
  '/about': 'Conoce la dirección de Herdown, el procesamiento local y las entradas para desarrolladores.', '/contact': 'Contacta con Herdown sobre conversiones, funcionamiento, privacidad o integraciones técnicas.', '/website-to-markdown': 'Rastrea páginas públicas desde un dominio, una URL inicial o un sitemap y exporta Markdown con sus fuentes.',
  '/': 'Convierte páginas web, documentos e imágenes en Markdown limpio para agentes de IA.', '/tools': 'Procesa TXT, Markdown, imágenes, Word, PDF, PPT y Excel en el navegador sin subirlos.', '/url-to-markdown': 'Extrae contenido, títulos, imágenes y datos de origen desde una URL web.', '/txt-to-markdown': 'Convierte texto plano en Markdown para guardar, editar o usar con IA.', '/pdf-to-markdown': 'Convierte PDF de texto a Markdown localmente; usa OCR local para PDF escaneados.', '/word-to-markdown': 'Convierte documentos Word y DOCX en Markdown estructurado en el navegador.', '/ppt-to-markdown': 'Convierte texto de presentaciones PowerPoint y PPTX en Markdown localmente.', '/excel-to-markdown': 'Convierte hojas Excel en tablas Markdown fáciles de leer y reutilizar.', '/csv-to-markdown': 'Convierte CSV o TSV en tablas Markdown y copia o descarga el resultado.', '/json-to-markdown': 'Convierte objetos, arrays y estructuras JSON anidadas en Markdown legible.', '/xml-to-markdown': 'Convierte sitemaps, RSS, Atom y XML anidado en Markdown legible.', '/rtf-to-markdown': 'Extrae párrafos, Unicode y listas básicas de RTF en Markdown.', '/paste-to-markdown': 'Convierte texto enriquecido, HTML o texto plano pegado en Markdown.', '/notion-to-markdown': 'Convierte páginas públicas de Notion o exportaciones HTML en Markdown.', '/google-docs-to-markdown': 'Convierte documentos públicos de Google Docs o exportaciones HTML en Markdown.', '/markdown-to-html': 'Convierte Markdown en un archivo HTML independiente listo para publicar.', '/markdown-to-pdf': 'Formatea Markdown como PDF A4 conservando títulos, tablas, código y enlaces.', '/markdown-to-word': 'Convierte Markdown en un DOCX editable para entregar o revisar.', '/markdown-to-csv': 'Extrae tablas Markdown y descárgalas como CSV.', '/markdown-viewer': 'Abre archivos .md localmente con vista previa en vivo y exportación HTML o PDF.', '/markdown-to-wechat': 'Formatea Markdown como texto enriquecido para pegarlo en el editor de WeChat.', '/markdown-to-xiaohongshu': 'Convierte Markdown en tarjetas de imagen para Xiaohongshu.', '/markdown-tools': 'Herramientas para ver, editar, convertir y publicar Markdown.', '/markdown-format-guide': 'Elige el formato Markdown adecuado para editar, entregar o publicar.', '/merge-documents': 'Une PDF, DOCX, PPTX o Excel con herramientas específicas por formato.', '/merge-pdf': 'Combina varios PDF en orden dentro del navegador.', '/merge-docx': 'Combina documentos DOCX conservando estilos, tablas, imágenes y listas cuando es posible.', '/merge-pptx': 'Combina presentaciones PPTX conservando diapositivas y relaciones multimedia.', '/merge-excel': 'Combina archivos Excel en un libro con modo de hojas o añadido.', '/sitemap-extractor': 'Descubre sitemaps, expande índices y exporta URLs sin duplicados.', '/sitemap-checker': 'Busca sitemaps y comprueba accesibilidad, estructura XML, cantidad y duplicados.', '/sitemap-validator': 'Valida sintaxis XML, campos del protocolo, URLs duplicadas y límites de archivo.', '/sitemap-generator': 'Rastrea un sitio o pega URLs para generar un sitemap.xml estándar.', '/website-url-extractor': 'Rastrea enlaces HTML del mismo sitio y exporta su inventario de URLs.', '/docs': 'Conecta Herdown con conversión web, REST API, MCP, CLI, Skill y extensión.', '/help': 'Consulta ayuda sobre conversión, archivos locales, cuenta, créditos y datos.', '/faq': 'Respuestas sobre análisis, almacenamiento, cuota gratuita y archivos locales.', '/api': 'Crea y administra claves API de Herdown y revisa el uso.', '/mcp': 'Usa la conversión web y el rastreo de sitios de Herdown desde un cliente MCP.', '/cli': 'Ejecuta Herdown desde la terminal y guarda páginas como Markdown.', '/skill': 'Conecta Herdown a un agente de IA para elegir el flujo adecuado.', '/pricing': 'Consulta la cuota gratuita y los créditos de compra única de Herdown.', '/browser-extension': 'Prepara la página abierta en el navegador y expórtala como Markdown.',
};

const deDescriptions: Record<string, string> = {
  '/about': 'Mehr über Herdown, lokale Verarbeitung, Produktausrichtung und Entwicklerzugänge erfahren.', '/contact': 'Herdown zu Konvertierung, Seitenverhalten, Datenschutz oder Entwicklerintegrationen kontaktieren.', '/website-to-markdown': 'Öffentliche Seiten aus Domain, Start-URL oder Sitemap crawlen und Markdown mit Quellen exportieren.',
  '/': 'Webseiten, Dokumente und Bilder in sauberes Markdown für AI-Agenten umwandeln.', '/tools': 'TXT, Markdown, Bilder, Word, PDF, PPT und Excel im Browser ohne Upload verarbeiten.', '/url-to-markdown': 'Inhalte, Titel, Bilder und Quelldaten aus einer Webseiten-URL extrahieren.', '/txt-to-markdown': 'Reinen Text in Markdown zum Speichern, Bearbeiten oder für AI umwandeln.', '/pdf-to-markdown': 'Text-PDFs lokal in Markdown umwandeln; für gescannte PDFs lokales OCR nutzen.', '/word-to-markdown': 'Word- und DOCX-Dokumente im Browser in strukturiertes Markdown umwandeln.', '/ppt-to-markdown': 'Text aus PowerPoint- und PPTX-Präsentationen lokal in Markdown umwandeln.', '/excel-to-markdown': 'Excel-Arbeitsblätter in gut lesbare und wiederverwendbare Markdown-Tabellen umwandeln.', '/csv-to-markdown': 'CSV oder TSV in Markdown-Tabellen umwandeln und das Ergebnis kopieren oder laden.', '/json-to-markdown': 'JSON-Objekte, Arrays und verschachtelte Strukturen in lesbares Markdown umwandeln.', '/xml-to-markdown': 'Sitemaps, RSS, Atom und verschachteltes XML in lesbares Markdown umwandeln.', '/rtf-to-markdown': 'Absätze, Unicode und einfache Listen aus RTF in Markdown extrahieren.', '/paste-to-markdown': 'Rich Text, HTML oder reinen Text aus der Zwischenablage in Markdown umwandeln.', '/notion-to-markdown': 'Öffentliche Notion-Seiten oder HTML-Exporte in Markdown umwandeln.', '/google-docs-to-markdown': 'Öffentliche Google Docs oder HTML-Exporte in Markdown umwandeln.', '/markdown-to-html': 'Markdown in eine eigenständige, veröffentlichungsfertige HTML-Datei umwandeln.', '/markdown-to-pdf': 'Markdown als A4-PDF formatieren und Überschriften, Tabellen, Code und Links erhalten.', '/markdown-to-word': 'Markdown in ein bearbeitbares DOCX für Lieferung und Review umwandeln.', '/markdown-to-csv': 'Markdown-Tabellen extrahieren und als CSV laden.', '/markdown-viewer': '.md-Dateien lokal mit Live-Vorschau und HTML- oder PDF-Export öffnen.', '/markdown-to-wechat': 'Markdown als Rich Text für den WeChat-Editor formatieren.', '/markdown-to-xiaohongshu': 'Markdown in Bildkarten für Xiaohongshu umwandeln.', '/markdown-tools': 'Markdown anzeigen, bearbeiten, konvertieren und veröffentlichen.', '/markdown-format-guide': 'Das passende Markdown-Format zum Bearbeiten, Liefern oder Veröffentlichen wählen.', '/merge-documents': 'PDF, DOCX, PPTX oder Excel mit formatbezogenen Werkzeugen zusammenführen.', '/merge-pdf': 'Mehrere PDFs lokal im Browser in der gewünschten Reihenfolge zusammenführen.', '/merge-docx': 'DOCX-Dokumente zusammenführen und Formatierungen möglichst erhalten.', '/merge-pptx': 'PPTX-Präsentationen zusammenführen und Folien sowie Medienbeziehungen erhalten.', '/merge-excel': 'Excel-Dateien in einer Arbeitsmappe mit Blatt- oder Anhängemodus zusammenführen.', '/sitemap-extractor': 'Sitemaps entdecken, Indizes erweitern und eindeutige URLs exportieren.', '/sitemap-checker': 'Sitemaps suchen und Zugriff, XML-Struktur, Anzahl und Duplikate prüfen.', '/sitemap-validator': 'XML-Syntax, Protokollfelder, doppelte URLs und Dateigrenzen prüfen.', '/sitemap-generator': 'Eine Website crawlen oder URLs einfügen und eine standardkonforme sitemap.xml erzeugen.', '/website-url-extractor': 'Öffentliche HTML-Links derselben Website crawlen und eine URL-Liste exportieren.', '/docs': 'Herdown mit Web-Konvertierung, REST API, MCP, CLI, Skill und Erweiterung verbinden.', '/help': 'Hilfe zu Konvertierung, lokalen Dateien, Konto, Credits und Datenverarbeitung finden.', '/faq': 'Antworten zu Parsing, Speicherung, Freikontingent und lokalen Dateien.', '/api': 'Herdown-API-Schlüssel erstellen, verwalten und Nutzung prüfen.', '/mcp': 'Herdown-Webkonvertierung und Site-Crawling über einen MCP-Client nutzen.', '/cli': 'Herdown im Terminal ausführen und Webseiten als Markdown speichern.', '/skill': 'Herdown mit einem AI-Agenten verbinden und den passenden Workflow wählen.', '/pricing': 'Herdown-Freikontingent und einmalige Credits ansehen.', '/browser-extension': 'Die geöffnete Browserseite vorbereiten und als Markdown exportieren.',
};

const entriesByPath = (language: SeoLanguage): Map<string, Entry> => {
  if (language === 'ja') return new Map(data.ja.map(entry => [entry[0], entry]));
  const names = translatedNames[language];
  const descriptions = language === 'es' ? esDescriptions : deDescriptions;
  return new Map(Object.keys(names).map(path => [path, [path, names[path], descriptions[path], `${names[path]},Herdown,Markdown`] as Entry]));
};

export const buildLocalizedSeoPages = (): Record<string, Partial<Record<SeoLanguage, SeoPage>>> => {
  const result: Record<string, Partial<Record<SeoLanguage, SeoPage>>> = {};
  for (const language of ['ja', 'es', 'de'] as SeoLanguage[]) {
    for (const [path, , description, keywords] of entriesByPath(language).values()) {
      const entry = entriesByPath(language).get(path);
      if (!entry) continue;
      const name = entry[1];
      result[path] ||= {};
      result[path][language] = {
        title: `${name}｜Herdown`,
        description,
        keywords,
        heading: name,
        intro: description,
      };
    }
  }
  const overrides: Record<SeoLanguage, Record<string, [string, string, string]>> = {
    ja: {
      '/': ['AIエージェント向け高品質Markdown', 'Webページ、文書、画像を高品質Markdownに変換し、ローカル処理、API、MCP、CLI、ブラウザ拡張機能へ接続できます。', 'WebページMarkdown,文書Markdown,AIエージェント,Markdown変換,API,MCP,CLI'],
      '/tools': ['ローカル文書Markdown変換ツール', 'Word、PDF、PPT、Excel、CSV、JSON、XML、RTF、Markdownをブラウザ内で変換し、確認して保存します。', 'ローカル文書変換,文書Markdown,PDFMarkdown,ExcelMarkdown'],
      '/url-to-markdown': ['無料URLからMarkdownへ変換', '無料URLからMarkdown変換で公開Webページを1つ処理し、本文、タイトル、画像、出典を確認して保存します。', 'URL Markdown,WebページMarkdown,HTML Markdown,無料URL変換'],
      '/docs': ['WebからMarkdownへの開発者ドキュメント', 'HerdownのWebからMarkdownへのワークフローをREST API、MCP、CLI、Skill、ブラウザ拡張機能で接続します。', 'Herdownドキュメント,REST API,MCP,CLI,Web Markdown'],
      '/skill': ['Herdown Skill｜AIエージェントワークフロー', 'Herdown Skillで公開URL、ローカルファイル、API、MCP、CLI、ブラウザ抽出、OCRを使い分けます。', 'Herdown Skill,AIエージェント,Markdown,ワークフロー'],
      '/pricing': ['Web解析の料金とクレジット', 'HerdownのWeb解析無料枠、日次ルール、一回購入型クレジットを確認してMarkdownワークフローを始めます。', 'Herdown料金,解析クレジット,無料枠,Web解析'],
      '/browser-extension': ['ローカルWebからMarkdownへのブラウザ拡張機能', '現在の描画ページをブラウザ内で抽出し、確認してクリーンなMarkdownとして保存します。', 'ブラウザ拡張機能,Webクリップ,Markdown,ローカル抽出'],
      '/excel-to-markdown': ['ExcelからMarkdownへ変換', 'XLSXワークシートをブラウザ内で読みやすいMarkdown表に変換し、形式の制限を確認して保存します。', 'Excel Markdown,XLSX Markdown,表計算Markdown,Excel変換'],
    },
    es: {
      '/': ['Markdown de alta calidad para agentes de IA', 'Convierte páginas web, documentos e imágenes en Markdown de alta calidad para agentes de IA y conecta API, MCP, CLI y herramientas locales.', 'web a Markdown,documento a Markdown,HTML a Markdown,Markdown para agentes,API,MCP,CLI'],
      '/tools': ['Herramientas locales de documentos a Markdown', 'Elige un conversor local de documentos a Markdown para Word, PDF, PPT, Excel, CSV, JSON, XML, RTF o Markdown.', 'documento a Markdown,conversión local,PDF a Markdown,Excel a Markdown'],
      '/url-to-markdown': ['Convertidor gratuito de URL a Markdown', 'Usa el convertidor gratuito de URL a Markdown para extraer una página pública, revisar la fuente y descargar Markdown limpio.', 'convertidor gratuito URL a Markdown,web a Markdown,HTML a Markdown'],
      '/docs': ['Documentación de web a Markdown para desarrolladores', 'Conecta los flujos de web a Markdown de Herdown mediante REST API, MCP, CLI, Skill y extensión.', 'documentación web a Markdown,REST API,MCP,CLI'],
      '/skill': ['Herdown Skill para flujos de agentes de IA', 'Usa Herdown Skill para enrutar un agente entre URL pública, archivos locales, API, MCP, CLI y OCR.', 'Herdown Skill,agentes de IA,flujo Markdown,OCR'],
      '/pricing': ['Precios de análisis web y créditos de Herdown', 'Revisa los precios de análisis web, la cuota gratuita y los créditos de pago único de Herdown.', 'precios análisis web,créditos Markdown,cuota gratuita'],
      '/browser-extension': ['Extensión local de web a Markdown de Herdown', 'Instala la extensión de Herdown para extraer localmente la página renderizada y exportar Markdown.', 'extensión web a Markdown,clipper local,extensión Markdown'],
      '/excel-to-markdown': ['Convertidor de Excel a Markdown', 'Convierte hojas XLSX en tablas Markdown legibles en el navegador con límites de formato y revisión.', 'Excel a Markdown,XLSX a Markdown,tabla Markdown'],
    },
    de: {
      '/': ['Hochwertiges Markdown für AI-Agenten', 'Webseiten, Dokumente und Bilder in hochwertiges Markdown für AI-Agenten umwandeln und mit API, MCP, CLI und lokalen Werkzeugen verbinden.', 'Web zu Markdown,Dokument zu Markdown,HTML zu Markdown,AI-Agent Markdown,API,MCP,CLI'],
      '/tools': ['Lokale Dokument-zu-Markdown-Werkzeuge', 'Einen lokalen Dokument-zu-Markdown-Konverter für Word, PDF, PPT, Excel, CSV, JSON, XML, RTF oder Markdown wählen.', 'Dokument zu Markdown,lokale Konvertierung,PDF zu Markdown,Excel zu Markdown'],
      '/url-to-markdown': ['Kostenloser URL-zu-Markdown-Konverter', 'Den kostenlosen URL-zu-Markdown-Konverter nutzen, die öffentliche Seite prüfen und sauberes Markdown laden.', 'kostenloser URL-zu-Markdown-Konverter,Web zu Markdown,HTML zu Markdown'],
      '/docs': ['Entwicklerdokumentation für Web zu Markdown', 'Herdown-Web-zu-Markdown-Workflows mit REST API, MCP, CLI, Skill und Browser-Erweiterung verbinden.', 'Web zu Markdown Dokumentation,REST API,MCP,CLI'],
      '/skill': ['Herdown Skill für AI-Agent-Workflows', 'Herdown Skill für das Routing eines AI-Agenten zwischen URL, lokalen Dateien, API, MCP, CLI und OCR nutzen.', 'Herdown Skill,AI-Agent Workflow,Markdown,OCR'],
      '/pricing': ['Preise für Web-Parsing und Herdown-Credits', 'Preise für Web-Parsing, Freikontingent und einmalige Herdown-Credits prüfen.', 'Web-Parsing Preise,Markdown Credits,Freikontingent'],
      '/browser-extension': ['Lokale Browser-Erweiterung von Web zu Markdown', 'Die lokale Herdown-Erweiterung installieren, die gerenderte Seite erfassen und Markdown exportieren.', 'Web zu Markdown Erweiterung,Web-Clipper,Markdown Erweiterung'],
      '/excel-to-markdown': ['Excel zu Markdown Konverter', 'XLSX-Arbeitsblätter im Browser in lesbare Markdown-Tabellen umwandeln und Formatgrenzen prüfen.', 'Excel zu Markdown,XLSX zu Markdown,Markdown Tabelle'],
    },
  };
  for (const language of ['ja', 'es', 'de'] as SeoLanguage[]) {
    for (const [path, [title, description, keywords]] of Object.entries(overrides[language])) {
      result[path] ||= {};
      result[path][language] = { title: `${title}｜Herdown`, description, keywords, heading: title, intro: description };
    }
  }
  return result;
};
