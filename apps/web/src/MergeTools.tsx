import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Download,
  FileStack,
  FileText,
  Files,
  Presentation,
  RefreshCw,
  Sheet,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { Language } from './i18n';
import { ToolSeoContent } from './ToolSeoContent';

type MergeKind = 'pdf' | 'docx' | 'pptx' | 'xlsx';
type MergeMode = 'sheets' | 'append';

type MergeFile = {
  id: string;
  file: File;
};

type MergeCopy = {
  title: string;
  eyebrow: string;
  description: string;
  inputLabel: string;
  inputHint: string;
  mergeAction: string;
  working: string;
  output: string;
  empty: string;
  addFiles: string;
  clear: string;
  download: string;
  success: (files: number, pages: number) => string;
  error: string;
  orderHint: string;
  moveUp: string;
  moveDown: string;
  remove: string;
  count: (files: number) => string;
  fileNote: string;
  limitation: string;
  modeTitle?: string;
  modeSheets?: string;
  modeAppend?: string;
  modeSheetsHint?: string;
  modeAppendHint?: string;
};

const copy: Record<MergeKind, Record<Language, MergeCopy>> = {
  pdf: {
    zh: {
      title: 'PDF合并', eyebrow: '本地PDF工具', description: '按你排列的顺序把多个PDF合并为一个PDF文件。文件只在当前浏览器处理。', inputLabel: '选择PDF文件', inputHint: '支持多选或拖入PDF文件，然后用上下箭头调整顺序。', mergeAction: '合并PDF', working: '正在合并PDF...', output: '合并结果', empty: '合并后会在这里显示文件信息。', addFiles: '添加PDF', clear: '清空', download: '下载合并后的PDF', success: (files, pages) => `已合并${files}个PDF，共${pages}页。`, error: 'PDF合并失败，请检查文件是否损坏或受密码保护。', orderHint: '文件顺序会影响最终PDF页码顺序。', moveUp: '上移', moveDown: '下移', remove: '移除', count: files => `${files}个文件`, fileNote: '页码、文字、图片和矢量内容会由PDF引擎复制到新文件。', limitation: '加密或损坏的PDF可能无法读取，请先在PDF阅读器中解锁或修复。',
    },
    en: {
      title: 'Merge PDF', eyebrow: 'Local PDF tool', description: 'Combine multiple PDF files in your chosen order into one PDF. Files stay in this browser.', inputLabel: 'Choose PDF files', inputHint: 'Select or drop PDF files, then use the arrows to set their order.', mergeAction: 'Merge PDF', working: 'Merging PDFs...', output: 'Merged file', empty: 'The merged file details will appear here.', addFiles: 'Add PDFs', clear: 'Clear', download: 'Download merged PDF', success: (files, pages) => `Merged ${files} PDF files with ${pages} pages.`, error: 'PDF merge failed. Check whether a file is damaged or password-protected.', orderHint: 'The file order becomes the page order in the merged PDF.', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', count: files => `${files} files`, fileNote: 'Pages, text, images, and vector content are copied by the PDF engine.', limitation: 'Encrypted or damaged PDFs may not open. Unlock or repair them in a PDF reader first.',
    },
    ja: {
      title: 'PDF結合', eyebrow: 'ローカルPDFツール', description: '選択した順番で複数のPDFを1つに結合します。ファイルはこのブラウザ内で処理されます。', inputLabel: 'PDFファイルを選択', inputHint: 'PDFを選択またはドロップし、矢印で順番を調整します。', mergeAction: 'PDFを結合', working: 'PDFを結合中...', output: '結合結果', empty: '結合後のファイル情報がここに表示されます。', addFiles: 'PDFを追加', clear: 'クリア', download: '結合PDFをダウンロード', success: (files, pages) => `${files}個のPDF、${pages}ページを結合しました。`, error: 'PDFの結合に失敗しました。破損またはパスワード保護を確認してください。', orderHint: 'ファイルの順番が結合後のページ順になります。', moveUp: '上へ', moveDown: '下へ', remove: '削除', count: files => `${files}個のファイル`, fileNote: 'ページ、テキスト、画像、ベクター情報をPDFエンジンでコピーします。', limitation: '暗号化または破損したPDFは開けない場合があります。先にPDFリーダーで解除または修復してください。',
    },
    es: {
      title: 'Unir PDF', eyebrow: 'Herramienta PDF local', description: 'Combina varios PDF en el orden elegido. Los archivos se procesan en este navegador.', inputLabel: 'Elegir archivos PDF', inputHint: 'Selecciona o arrastra los PDF y usa las flechas para ordenar.', mergeAction: 'Unir PDF', working: 'Uniendo PDF...', output: 'Archivo unido', empty: 'Aquí aparecerán los detalles del archivo unido.', addFiles: 'Añadir PDF', clear: 'Limpiar', download: 'Descargar PDF unido', success: (files, pages) => `Se unieron ${files} PDF con ${pages} páginas.`, error: 'No se pudieron unir los PDF. Comprueba si algún archivo está dañado o protegido.', orderHint: 'El orden de los archivos será el orden de las páginas.', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Quitar', count: files => `${files} archivos`, fileNote: 'El motor PDF copia páginas, texto, imágenes y contenido vectorial.', limitation: 'Los PDF cifrados o dañados pueden no abrirse. Desbloquéalos o repáralos antes.',
    },
    de: {
      title: 'PDF zusammenführen', eyebrow: 'Lokales PDF-Tool', description: 'Führe mehrere PDF-Dateien in der gewählten Reihenfolge zusammen. Die Dateien bleiben im Browser.', inputLabel: 'PDF-Dateien auswählen', inputHint: 'Wähle PDF-Dateien aus oder ziehe sie hierher und ordne sie mit den Pfeilen.', mergeAction: 'PDF zusammenführen', working: 'PDFs werden zusammengeführt...', output: 'Zusammengeführte Datei', empty: 'Die Informationen zur zusammengeführten Datei erscheinen hier.', addFiles: 'PDFs hinzufügen', clear: 'Leeren', download: 'Zusammengeführtes PDF laden', success: (files, pages) => `${files} PDF-Dateien mit ${pages} Seiten zusammengeführt.`, error: 'PDF-Zusammenführung fehlgeschlagen. Prüfe beschädigte oder passwortgeschützte Dateien.', orderHint: 'Die Dateireihenfolge wird zur Seitenreihenfolge.', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', count: files => `${files} Dateien`, fileNote: 'Seiten, Text, Bilder und Vektorinhalte werden vom PDF-Engine kopiert.', limitation: 'Verschlüsselte oder beschädigte PDFs lassen sich möglicherweise nicht öffnen. Entsperre oder repariere sie zuerst.',
    },
  },
  docx: {
    zh: {
      title: 'DOCX合并', eyebrow: '本地Word工具', description: '按文件顺序把多个DOCX合并为一个Word文档，尽量保留样式、表格、图片和列表。', inputLabel: '选择DOCX文件', inputHint: '支持多选或拖入DOCX文件，文件之间会插入分页。', mergeAction: '合并DOCX', working: '正在合并DOCX...', output: '合并结果', empty: '合并后会在这里显示文件信息。', addFiles: '添加DOCX', clear: '清空', download: '下载合并后的DOCX', success: (files, pages) => `已合并${files}个DOCX文档。`, error: 'DOCX合并失败，请检查文件是否为有效的Word文档。', orderHint: '文件顺序会影响合并后文档的章节顺序。', moveUp: '上移', moveDown: '下移', remove: '移除', count: files => `${files}个文件`, fileNote: '合并库会尽量保留正文样式、表格、图片、项目符号和编号。', limitation: '复杂批注、宏、嵌入对象和部分编号样式可能需要在Word中复核。',
    },
    en: {
      title: 'Merge DOCX', eyebrow: 'Local Word tool', description: 'Combine DOCX files in order into one Word document while preserving styles, tables, images, and lists when possible.', inputLabel: 'Choose DOCX files', inputHint: 'Select or drop DOCX files. A page break is inserted between documents.', mergeAction: 'Merge DOCX', working: 'Merging DOCX files...', output: 'Merged file', empty: 'The merged file details will appear here.', addFiles: 'Add DOCX files', clear: 'Clear', download: 'Download merged DOCX', success: files => `Merged ${files} DOCX documents.`, error: 'DOCX merge failed. Check that every file is a valid Word document.', orderHint: 'The file order becomes the section order in the merged document.', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', count: files => `${files} files`, fileNote: 'The merger attempts to preserve body styles, tables, images, bullets, and numbering.', limitation: 'Review complex comments, macros, embedded objects, and some numbering styles in Word.',
    },
    ja: {
      title: 'DOCX結合', eyebrow: 'ローカルWordツール', description: '複数のDOCXを順番に1つのWord文書へ結合し、可能な限り書式、表、画像、リストを保持します。', inputLabel: 'DOCXファイルを選択', inputHint: 'DOCXを選択またはドロップします。文書の間に改ページを入れます。', mergeAction: 'DOCXを結合', working: 'DOCXを結合中...', output: '結合結果', empty: '結合後のファイル情報がここに表示されます。', addFiles: 'DOCXを追加', clear: 'クリア', download: '結合DOCXをダウンロード', success: files => `${files}個のDOCX文書を結合しました。`, error: 'DOCXの結合に失敗しました。有効なWord文書か確認してください。', orderHint: 'ファイルの順番が文書内の章の順番になります。', moveUp: '上へ', moveDown: '下へ', remove: '削除', count: files => `${files}個のファイル`, fileNote: '本文の書式、表、画像、箇条書き、番号を可能な限り保持します。', limitation: 'コメント、マクロ、埋め込みオブジェクト、一部の番号書式はWordで確認してください。',
    },
    es: {
      title: 'Unir DOCX', eyebrow: 'Herramienta Word local', description: 'Combina documentos DOCX en orden y conserva, cuando es posible, estilos, tablas, imágenes y listas.', inputLabel: 'Elegir archivos DOCX', inputHint: 'Selecciona o arrastra los DOCX. Se inserta un salto de página entre documentos.', mergeAction: 'Unir DOCX', working: 'Uniendo DOCX...', output: 'Archivo unido', empty: 'Aquí aparecerán los detalles del archivo unido.', addFiles: 'Añadir DOCX', clear: 'Limpiar', download: 'Descargar DOCX unido', success: files => `Se unieron ${files} documentos DOCX.`, error: 'No se pudo unir el DOCX. Comprueba que cada archivo sea un documento Word válido.', orderHint: 'El orden determina el orden de las secciones.', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Quitar', count: files => `${files} archivos`, fileNote: 'El motor intenta conservar estilos, tablas, imágenes, viñetas y numeración.', limitation: 'Revisa en Word los comentarios, macros, objetos incrustados y algunos estilos de numeración.',
    },
    de: {
      title: 'DOCX zusammenführen', eyebrow: 'Lokales Word-Tool', description: 'Führe DOCX-Dateien in der gewählten Reihenfolge zu einem Word-Dokument zusammen und erhalte möglichst viele Formatierungen.', inputLabel: 'DOCX-Dateien auswählen', inputHint: 'Wähle DOCX-Dateien aus oder ziehe sie hierher. Zwischen Dokumenten wird ein Seitenumbruch eingefügt.', mergeAction: 'DOCX zusammenführen', working: 'DOCX-Dateien werden zusammengeführt...', output: 'Zusammengeführte Datei', empty: 'Die Informationen zur zusammengeführten Datei erscheinen hier.', addFiles: 'DOCX hinzufügen', clear: 'Leeren', download: 'Zusammengeführtes DOCX laden', success: files => `${files} DOCX-Dokumente zusammengeführt.`, error: 'DOCX-Zusammenführung fehlgeschlagen. Prüfe gültige Word-Dokumente.', orderHint: 'Die Reihenfolge bestimmt die Reihenfolge der Abschnitte.', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', count: files => `${files} Dateien`, fileNote: 'Formatierungen, Tabellen, Bilder, Aufzählungen und Nummerierungen werden möglichst erhalten.', limitation: 'Prüfe Kommentare, Makros, eingebettete Objekte und manche Nummerierungen in Word.',
    },
  },
  pptx: {
    zh: {
      title: 'PPTX合并', eyebrow: '本地PowerPoint工具', description: '按文件顺序把多个PPTX演示文稿合并为一个文件，保留原始幻灯片和媒体关系。', inputLabel: '选择PPTX文件', inputHint: '支持多选或拖入PPTX文件，幻灯片会按文件顺序追加。', mergeAction: '合并PPTX', working: '正在合并PPTX...', output: '合并结果', empty: '合并后会在这里显示文件信息。', addFiles: '添加PPTX', clear: '清空', download: '下载合并后的PPTX', success: (files, pages) => `已合并${files}个PPTX，共${pages}张幻灯片。`, error: 'PPTX合并失败，请检查文件是否为有效的PowerPoint文件。', orderHint: '文件顺序会影响最终幻灯片顺序。', moveUp: '上移', moveDown: '下移', remove: '移除', count: files => `${files}个文件`, fileNote: '工具直接合并PPTX内部幻灯片包，并复制图片、图表、主题和版式关系。', limitation: '外部链接、宏和极少数非标准扩展可能需要在PowerPoint中复核。',
    },
    en: {
      title: 'Merge PPTX', eyebrow: 'Local PowerPoint tool', description: 'Combine PPTX presentations in order into one file while retaining the original slides and media relationships.', inputLabel: 'Choose PPTX files', inputHint: 'Select or drop PPTX files. Slides are appended in file order.', mergeAction: 'Merge PPTX', working: 'Merging PPTX files...', output: 'Merged file', empty: 'The merged file details will appear here.', addFiles: 'Add PPTX files', clear: 'Clear', download: 'Download merged PPTX', success: (files, pages) => `Merged ${files} PPTX files with ${pages} slides.`, error: 'PPTX merge failed. Check that every file is a valid PowerPoint presentation.', orderHint: 'The file order becomes the slide order in the output.', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', count: files => `${files} files`, fileNote: 'The tool merges the internal PPTX slide package and copies images, charts, themes, and layouts.', limitation: 'Review external links, macros, and rare non-standard extensions in PowerPoint.',
    },
    ja: {
      title: 'PPTX結合', eyebrow: 'ローカルPowerPointツール', description: '複数のPPTXを順番に1つへ結合し、元のスライドとメディアの関連を保持します。', inputLabel: 'PPTXファイルを選択', inputHint: 'PPTXを選択またはドロップします。スライドはファイル順に追加されます。', mergeAction: 'PPTXを結合', working: 'PPTXを結合中...', output: '結合結果', empty: '結合後のファイル情報がここに表示されます。', addFiles: 'PPTXを追加', clear: 'クリア', download: '結合PPTXをダウンロード', success: (files, pages) => `${files}個のPPTX、${pages}枚のスライドを結合しました。`, error: 'PPTXの結合に失敗しました。有効なPowerPointか確認してください。', orderHint: 'ファイルの順番がスライドの順番になります。', moveUp: '上へ', moveDown: '下へ', remove: '削除', count: files => `${files}個のファイル`, fileNote: 'PPTX内部のスライドパッケージを結合し、画像、グラフ、テーマ、レイアウトをコピーします。', limitation: '外部リンク、マクロ、まれな拡張機能はPowerPointで確認してください。',
    },
    es: {
      title: 'Unir PPTX', eyebrow: 'Herramienta PowerPoint local', description: 'Combina presentaciones PPTX en orden conservando las diapositivas y relaciones de medios originales.', inputLabel: 'Elegir archivos PPTX', inputHint: 'Selecciona o arrastra los PPTX. Las diapositivas se añaden en el orden de los archivos.', mergeAction: 'Unir PPTX', working: 'Uniendo PPTX...', output: 'Archivo unido', empty: 'Aquí aparecerán los detalles del archivo unido.', addFiles: 'Añadir PPTX', clear: 'Limpiar', download: 'Descargar PPTX unido', success: (files, pages) => `Se unieron ${files} PPTX con ${pages} diapositivas.`, error: 'No se pudo unir el PPTX. Comprueba que cada archivo sea una presentación válida.', orderHint: 'El orden de los archivos será el orden de las diapositivas.', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Quitar', count: files => `${files} archivos`, fileNote: 'Se combina el paquete interno de diapositivas y se copian imágenes, gráficos, temas y diseños.', limitation: 'Revisa en PowerPoint los enlaces externos, macros y extensiones poco habituales.',
    },
    de: {
      title: 'PPTX zusammenführen', eyebrow: 'Lokales PowerPoint-Tool', description: 'Führe PPTX-Präsentationen in der gewählten Reihenfolge zusammen und erhalte die ursprünglichen Folien und Medienbeziehungen.', inputLabel: 'PPTX-Dateien auswählen', inputHint: 'Wähle PPTX-Dateien aus oder ziehe sie hierher. Folien werden in Dateireihenfolge angefügt.', mergeAction: 'PPTX zusammenführen', working: 'PPTX-Dateien werden zusammengeführt...', output: 'Zusammengeführte Datei', empty: 'Die Informationen zur zusammengeführten Datei erscheinen hier.', addFiles: 'PPTX hinzufügen', clear: 'Leeren', download: 'Zusammengeführtes PPTX laden', success: (files, pages) => `${files} PPTX-Dateien mit ${pages} Folien zusammengeführt.`, error: 'PPTX-Zusammenführung fehlgeschlagen. Prüfe gültige PowerPoint-Dateien.', orderHint: 'Die Dateireihenfolge wird zur Folienreihenfolge.', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', count: files => `${files} Dateien`, fileNote: 'Das interne PPTX-Folienpaket wird zusammengeführt, Bilder, Diagramme, Designs und Layouts werden kopiert.', limitation: 'Prüfe externe Links, Makros und seltene Erweiterungen in PowerPoint.',
    },
  },
  xlsx: {
    zh: {
      title: 'Excel合并', eyebrow: '本地Excel工具', description: '把多个Excel文件合并为一个工作簿。默认每个文件生成一个工作表，也可以把数据追加到同一张表。', inputLabel: '选择Excel文件', inputHint: '支持XLSX和XLS文件，文件会按排列顺序处理。', mergeAction: '合并Excel', working: '正在合并Excel...', output: '合并结果', empty: '合并后会在这里显示工作表信息。', addFiles: '添加Excel', clear: '清空', download: '下载合并后的Excel', success: (files, pages) => `已处理${files}个Excel文件，生成${pages}张工作表。`, error: 'Excel合并失败，请检查文件格式或工作簿是否损坏。', orderHint: '文件顺序会影响工作表顺序和追加数据顺序。', moveUp: '上移', moveDown: '下移', remove: '移除', count: files => `${files}个文件`, fileNote: '默认每个源文件一个工作表，多工作表文件会按源工作表顺序展开。', limitation: '公式会按工作表数据读取，宏、图表、透视表和复杂格式不会原样合并。', modeTitle: '合并方式', modeSheets: '每个文件一个工作表', modeAppend: '追加到一个工作表', modeSheetsHint: '默认模式。每个源文件对应一个输出工作表。', modeAppendHint: '把所有源工作表的数据追加到“合并数据”，并加入来源文件和来源工作表列。',
    },
    en: {
      title: 'Merge Excel', eyebrow: 'Local Excel tool', description: 'Combine multiple Excel files into one workbook. The default creates one worksheet per file, with an append-to-one-sheet mode.', inputLabel: 'Choose Excel files', inputHint: 'XLSX and XLS files are supported and processed in the displayed order.', mergeAction: 'Merge Excel', working: 'Merging Excel files...', output: 'Merged workbook', empty: 'The merged worksheet details will appear here.', addFiles: 'Add Excel files', clear: 'Clear', download: 'Download merged Excel', success: (files, pages) => `Processed ${files} Excel files and created ${pages} worksheets.`, error: 'Excel merge failed. Check the workbook format or file integrity.', orderHint: 'File order controls worksheet order and append order.', moveUp: 'Move up', moveDown: 'Move down', remove: 'Remove', count: files => `${files} files`, fileNote: 'The default creates one worksheet per source file and flattens multiple source sheets in order.', limitation: 'Formulas are read as worksheet data. Macros, charts, pivot tables, and complex formatting are not merged byte-for-byte.', modeTitle: 'Merge mode', modeSheets: 'One worksheet per file', modeAppend: 'Append into one worksheet', modeSheetsHint: 'Default. Each source file becomes one output worksheet.', modeAppendHint: 'Append all source sheets into “Merged data” with source file and source worksheet columns.',
    },
    ja: {
      title: 'Excel結合', eyebrow: 'ローカルExcelツール', description: '複数のExcelを1つのブックに結合します。既定ではファイルごとに1シート、1シートへ追加するモードも選べます。', inputLabel: 'Excelファイルを選択', inputHint: 'XLSXとXLSに対応し、表示された順番で処理します。', mergeAction: 'Excelを結合', working: 'Excelを結合中...', output: '結合結果', empty: '結合後のシート情報がここに表示されます。', addFiles: 'Excelを追加', clear: 'クリア', download: '結合Excelをダウンロード', success: (files, pages) => `${files}個のExcelから${pages}シートを作成しました。`, error: 'Excelの結合に失敗しました。形式またはファイルの破損を確認してください。', orderHint: 'ファイル順がシート順と追加順になります。', moveUp: '上へ', moveDown: '下へ', remove: '削除', count: files => `${files}個のファイル`, fileNote: '既定ではファイルごとに1シート。複数シートは元の順番で展開します。', limitation: '数式はシートデータとして読み込みます。マクロ、グラフ、ピボット、複雑な書式はそのまま結合されません。', modeTitle: '結合モード', modeSheets: 'ファイルごとに1シート', modeAppend: '1シートに追加', modeSheetsHint: '既定。各ファイルを1つの出力シートにします。', modeAppendHint: 'すべてのシートを「結合データ」に追加し、元ファイルと元シートの列を付けます。',
    },
    es: {
      title: 'Unir Excel', eyebrow: 'Herramienta Excel local', description: 'Combina varios archivos Excel en un libro. Por defecto crea una hoja por archivo y también permite añadir todo a una hoja.', inputLabel: 'Elegir archivos Excel', inputHint: 'Admite XLSX y XLS y procesa los archivos en el orden mostrado.', mergeAction: 'Unir Excel', working: 'Uniendo Excel...', output: 'Libro unido', empty: 'Aquí aparecerán los detalles de las hojas.', addFiles: 'Añadir Excel', clear: 'Limpiar', download: 'Descargar Excel unido', success: (files, pages) => `Se procesaron ${files} archivos Excel y se crearon ${pages} hojas.`, error: 'No se pudo unir Excel. Comprueba el formato o la integridad del libro.', orderHint: 'El orden controla el orden de las hojas y de los datos añadidos.', moveUp: 'Subir', moveDown: 'Bajar', remove: 'Quitar', count: files => `${files} archivos`, fileNote: 'Por defecto hay una hoja por archivo; los libros con varias hojas se aplanan en orden.', limitation: 'Las fórmulas se leen como datos. Macros, gráficos, tablas dinámicas y formatos complejos no se fusionan byte a byte.', modeTitle: 'Modo de unión', modeSheets: 'Una hoja por archivo', modeAppend: 'Añadir a una hoja', modeSheetsHint: 'Predeterminado. Cada archivo se convierte en una hoja.', modeAppendHint: 'Añade todas las hojas a “Datos unidos” con columnas de archivo y hoja de origen.',
    },
    de: {
      title: 'Excel zusammenführen', eyebrow: 'Lokales Excel-Tool', description: 'Führe mehrere Excel-Dateien zu einer Arbeitsmappe zusammen. Standardmäßig entsteht ein Blatt pro Datei, alternativ ein gemeinsames Blatt.', inputLabel: 'Excel-Dateien auswählen', inputHint: 'XLSX und XLS werden unterstützt und in der angezeigten Reihenfolge verarbeitet.', mergeAction: 'Excel zusammenführen', working: 'Excel-Dateien werden zusammengeführt...', output: 'Zusammengeführte Arbeitsmappe', empty: 'Die Informationen zu den Blättern erscheinen hier.', addFiles: 'Excel hinzufügen', clear: 'Leeren', download: 'Zusammengeführtes Excel laden', success: (files, pages) => `${files} Excel-Dateien verarbeitet und ${pages} Blätter erstellt.`, error: 'Excel-Zusammenführung fehlgeschlagen. Prüfe Format und Integrität der Arbeitsmappe.', orderHint: 'Die Dateireihenfolge bestimmt Blatt- und Anhängereihenfolge.', moveUp: 'Nach oben', moveDown: 'Nach unten', remove: 'Entfernen', count: files => `${files} Dateien`, fileNote: 'Standardmäßig ein Blatt pro Datei; mehrere Quellblätter werden in ihrer Reihenfolge zusammengeführt.', limitation: 'Formeln werden als Blattdaten gelesen. Makros, Diagramme, Pivot-Tabellen und komplexe Formatierungen werden nicht 1:1 zusammengeführt.', modeTitle: 'Zusammenführungsmodus', modeSheets: 'Ein Blatt pro Datei', modeAppend: 'In ein Blatt anhängen', modeSheetsHint: 'Standard. Jede Quelldatei wird zu einem Ausgabeblatt.', modeAppendHint: 'Alle Quellblätter werden mit Spalten für Quelldatei und Quellblatt in „Zusammengeführte Daten“ angehängt.',
    },
  },
};

const extensionMap: Record<MergeKind, string[]> = {
  pdf: ['.pdf'],
  docx: ['.docx'],
  pptx: ['.pptx'],
  xlsx: ['.xlsx', '.xls'],
};

const mimeMap: Record<MergeKind, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

const iconMap = { pdf: FileText, docx: FileStack, pptx: Presentation, xlsx: Sheet } satisfies Record<MergeKind, typeof FileText>;

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1200);
};

const safeName = (name: string) => name.replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'herdown-merged';

const uniqueName = (name: string, used: Set<string>) => {
  const base = name.slice(0, 31) || 'Sheet';
  let candidate = base;
  let index = 2;
  while (used.has(candidate)) {
    const suffix = `-${index}`;
    candidate = `${base.slice(0, 31 - suffix.length)}${suffix}`;
    index += 1;
  }
  used.add(candidate);
  return candidate;
};

const normalizeZipPath = (value: string) => {
  const parts: string[] = [];
  value.split('/').forEach(part => {
    if (!part || part === '.') return;
    if (part === '..') parts.pop();
    else parts.push(part);
  });
  return parts.join('/');
};

const zipDirectory = (partPath: string) => partPath.includes('/') ? partPath.slice(0, partPath.lastIndexOf('/') + 1) : '';

const relativeZipPath = (fromPart: string, toPart: string) => {
  const fromDirectory = zipDirectory(fromPart).split('/').filter(Boolean);
  const toSegments = toPart.split('/').filter(Boolean);
  let common = 0;
  while (common < fromDirectory.length && common < toSegments.length && fromDirectory[common] === toSegments[common]) common += 1;
  return [...Array.from({ length: fromDirectory.length - common }, () => '..'), ...toSegments.slice(common)].join('/') || toSegments.at(-1) || '';
};

const xmlAttribute = (tag: string, name: string) => {
  const match = tag.match(new RegExp(`\\b${name.replace(':', '\\:')}\\s*=\\s*"([^"]*)"`));
  return match?.[1] || '';
};

const escapeXml = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const relationshipPartPath = (partPath: string) => {
  const slash = partPath.lastIndexOf('/');
  const directory = slash >= 0 ? partPath.slice(0, slash + 1) : '';
  const filename = slash >= 0 ? partPath.slice(slash + 1) : partPath;
  return `${directory}_rels/${filename}.rels`;
};

const findContentType = (xml: string, partPath: string) => {
  const escaped = partPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = xml.match(new RegExp(`<Override\\b[^>]*PartName="/${escaped}"[^>]*ContentType="([^"]+)"[^>]*/?>`, 'i'));
  if (match?.[1]) return match[1];
  const extension = partPath.includes('.') ? partPath.slice(partPath.lastIndexOf('.') + 1).toLowerCase() : '';
  const defaultType = xml.match(new RegExp(`<Default\\b[^>]*Extension="${extension}"[^>]*ContentType="([^"]+)"[^>]*/?>`, 'i'));
  return defaultType?.[1] || 'application/xml';
};

const addContentType = (xml: string, partPath: string, contentType: string) => {
  const partName = `/${partPath}`;
  if (xml.includes(`PartName="${partName}"`)) return xml;
  const insertion = `<Override PartName="${escapeXml(partName)}" ContentType="${escapeXml(contentType)}"/>`;
  return xml.replace(/<\/[Cc]Types>\s*$/, `${insertion}</Types>`);
};

const parseRelationships = (xml: string) => Array.from(xml.matchAll(/<Relationship\b[^>]*\/>/g)).map(match => match[0]);

const pptxSlidePaths = (zip: { files: Record<string, unknown> }) => Object.keys(zip.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name)).sort((a, b) => Number(a.match(/slide(\d+)/i)?.[1] || 0) - Number(b.match(/slide(\d+)/i)?.[1] || 0));

const mergePdfFiles = async (files: File[]) => {
  const { PDFDocument } = await import('pdf-lib');
  const output = await PDFDocument.create();
  let pageCount = 0;
  for (const file of files) {
    const source = await PDFDocument.load(await file.arrayBuffer());
    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach(page => output.addPage(page));
    pageCount += pages.length;
  }
  const bytes = await output.save();
  const verification = await PDFDocument.load(bytes);
  if (verification.getPageCount() !== pageCount) throw new Error('PDF verification failed.');
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { blob: new Blob([buffer], { type: mimeMap.pdf }), pages: pageCount };
};

const mergeDocxFiles = async (files: File[]) => {
  const module = await import('docx-merger');
  const DocxMerger = module.default;
  const binaries = await Promise.all(files.map(file => file.arrayBuffer()));
  const merger = new DocxMerger({ pageBreak: true }, binaries);
  const data = await new Promise<Blob | ArrayBuffer | Uint8Array>((resolve, reject) => {
    try {
      merger.save('blob', result => resolve(result));
    } catch (error) {
      reject(error);
    }
  });
  const blob = data instanceof Blob ? data : data instanceof ArrayBuffer ? new Blob([data], { type: mimeMap.docx }) : new Blob([data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer], { type: mimeMap.docx });
  const JSZip = (await import('jszip')).default;
  const archive = await JSZip.loadAsync(await blob.arrayBuffer());
  const documentXml = await archive.file('word/document.xml')?.async('text');
  if (!documentXml || !documentXml.includes('<w:body')) throw new Error('DOCX verification failed.');
  return { blob, pages: files.length };
};

const mergePptxFiles = async (files: File[]) => {
  const JSZip = (await import('jszip')).default;
  const archives = await Promise.all(files.map(async file => JSZip.loadAsync(await file.arrayBuffer())));
  const output = archives[0];
  const presentationPath = 'ppt/presentation.xml';
  const presentationRelsPath = 'ppt/_rels/presentation.xml.rels';
  let presentationXml = (await output.file(presentationPath)?.async('text')) || '';
  let presentationRelsXml = (await output.file(presentationRelsPath)?.async('text')) || '';
  let contentTypesXml = (await output.file('[Content_Types].xml')?.async('text')) || '';
  if (!presentationXml || !presentationRelsXml || !contentTypesXml) throw new Error('PPTX package is missing required parts.');
  const usedIds = Array.from(presentationRelsXml.matchAll(/Id="rId(\d+)"/g)).map(match => Number(match[1])).filter(Number.isFinite);
  let nextRelId = Math.max(0, ...usedIds) + 1;
  const slideIds = Array.from(presentationXml.matchAll(/<p:sldId\b[^>]*\bid="(\d+)"/g)).map(match => Number(match[1])).filter(Number.isFinite);
  let nextSlideId = Math.max(255, ...slideIds) + 1;
  let totalSlides = pptxSlidePaths(output).length;
  let nextSlideNumber = Math.max(0, ...pptxSlidePaths(output).map(path => Number(path.match(/slide(\d+)/i)?.[1] || 0))) + 1;

  for (let archiveIndex = 1; archiveIndex < archives.length; archiveIndex += 1) {
    const source = archives[archiveIndex];
    const sourcePresentationXml = (await source.file(presentationPath)?.async('text')) || '';
    const sourceRelsXml = (await source.file(presentationRelsPath)?.async('text')) || '';
    const sourceContentTypesXml = (await source.file('[Content_Types].xml')?.async('text')) || '';
    if (!sourcePresentationXml || !sourceRelsXml || !sourceContentTypesXml) throw new Error('A PPTX package is missing required parts.');
    const sourceSlideRels = new Map<string, string>();
    parseRelationships(sourceRelsXml).forEach(tag => {
      const type = xmlAttribute(tag, 'Type');
      const target = xmlAttribute(tag, 'Target');
      if (type.endsWith('/slide')) sourceSlideRels.set(xmlAttribute(tag, 'Id'), normalizeZipPath(zipDirectory(presentationPath) + target));
    });
    const sourceSlides = Array.from(sourcePresentationXml.matchAll(/<p:sldId\b[^>]*\br:id="([^"]+)"[^>]*\/>/g)).map(match => sourceSlideRels.get(match[1])).filter((value): value is string => Boolean(value));
    const partMap = new Map<string, string>();
    sourceSlides.forEach(slidePath => {
      const slideNumber = nextSlideNumber;
      partMap.set(slidePath, `ppt/slides/slide${slideNumber}.xml`);
      nextSlideNumber += 1;
      totalSlides += 1;
    });
    const copied = new Set<string>();
    const copyPart = async (sourcePartPath: string): Promise<string> => {
      if (partMap.has(sourcePartPath) && copied.has(sourcePartPath)) return partMap.get(sourcePartPath)!;
      if (!partMap.has(sourcePartPath)) {
        const filename = sourcePartPath.slice(sourcePartPath.lastIndexOf('/') + 1);
        const slash = sourcePartPath.lastIndexOf('/');
        const directory = slash >= 0 ? sourcePartPath.slice(0, slash + 1) : '';
        const dot = filename.lastIndexOf('.');
        const stem = dot >= 0 ? filename.slice(0, dot) : filename;
        const extension = dot >= 0 ? filename.slice(dot) : '';
        partMap.set(sourcePartPath, `${directory}${stem}-source${archiveIndex}${extension}`);
      }
      const destinationPartPath = partMap.get(sourcePartPath)!;
      if (copied.has(sourcePartPath)) return destinationPartPath;
      copied.add(sourcePartPath);
      const sourceEntry = source.file(sourcePartPath);
      if (!sourceEntry) throw new Error(`Missing PPTX part: ${sourcePartPath}`);
      const relsPath = relationshipPartPath(sourcePartPath);
      const sourceRels = await source.file(relsPath)?.async('text');
      if (sourceRels) {
        let rewrittenRels = sourceRels;
        for (const tag of parseRelationships(sourceRels)) {
          const target = xmlAttribute(tag, 'Target');
          if (!target || xmlAttribute(tag, 'TargetMode').toLowerCase() === 'external') continue;
          const relatedSource = normalizeZipPath(zipDirectory(sourcePartPath) + target);
          const relatedDestination = await copyPart(relatedSource);
          rewrittenRels = rewrittenRels.replace(tag, tag.replace(`Target="${target}"`, `Target="${relativeZipPath(destinationPartPath, relatedDestination)}"`));
        }
        const destinationRelsPath = relationshipPartPath(destinationPartPath);
        output.file(destinationRelsPath, rewrittenRels);
        contentTypesXml = addContentType(contentTypesXml, destinationRelsPath, 'application/vnd.openxmlformats-package.relationships+xml');
      }
      const extension = sourcePartPath.includes('.') ? sourcePartPath.slice(sourcePartPath.lastIndexOf('.') + 1).toLowerCase() : '';
      if (sourceRels) {
        const sourceText = await sourceEntry.async('text');
        let rewrittenPart = sourceText;
        for (const tag of parseRelationships(sourceText)) {
          const target = xmlAttribute(tag, 'Target');
          if (!target || xmlAttribute(tag, 'TargetMode').toLowerCase() === 'external') continue;
          const relatedSource = normalizeZipPath(zipDirectory(sourcePartPath) + target);
          const relatedDestination = partMap.get(relatedSource);
          if (relatedDestination) rewrittenPart = rewrittenPart.replace(tag, tag.replace(`Target="${target}"`, `Target="${relativeZipPath(destinationPartPath, relatedDestination)}"`));
        }
        output.file(destinationPartPath, rewrittenPart);
      } else if (extension === 'xml' || extension === 'rels') {
        output.file(destinationPartPath, await sourceEntry.async('text'));
      } else {
        output.file(destinationPartPath, await sourceEntry.async('uint8array'));
      }
      contentTypesXml = addContentType(contentTypesXml, destinationPartPath, findContentType(sourceContentTypesXml, sourcePartPath));
      return destinationPartPath;
    };

    for (const sourceSlidePath of sourceSlides) {
      const destinationSlidePath = await copyPart(sourceSlidePath);
      const relId = `rId${nextRelId++}`;
      const slideId = nextSlideId++;
      presentationRelsXml = presentationRelsXml.replace(/<\/[Rr]elationships>\s*$/, `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="${destinationSlidePath.slice('ppt/'.length)}"/></Relationships>`);
      presentationXml = presentationXml.replace(/<\/[Pp]:?sldIdLst>/, `<p:sldId id="${slideId}" r:id="${relId}"/></p:sldIdLst>`);
    }
  }
  output.file(presentationPath, presentationXml);
  output.file(presentationRelsPath, presentationRelsXml);
  output.file('[Content_Types].xml', contentTypesXml);
  const bytes = await output.generateAsync({ type: 'uint8array' });
  const verification = await JSZip.loadAsync(bytes);
  const slides = Object.keys(verification.files).filter(name => /^ppt\/slides\/slide\d+\.xml$/i.test(name));
  if (slides.length !== totalSlides || !verification.file(presentationPath)) throw new Error('PPTX verification failed.');
  for (const relationshipPath of Object.keys(verification.files).filter(name => /\.rels$/i.test(name))) {
    const relationshipXml = await verification.file(relationshipPath)?.async('text');
    if (!relationshipXml) continue;
    const relationshipParts = relationshipPath.split('/');
    const relationshipFilename = relationshipParts.pop() || '';
    if (relationshipFilename === '.rels' && relationshipParts.at(-1) === '_rels') relationshipParts.pop();
    const sourcePartPath = relationshipParts.filter(part => part !== '_rels').concat(relationshipFilename.replace(/\.rels$/i, '')).join('/');
    for (const tag of parseRelationships(relationshipXml)) {
      const target = xmlAttribute(tag, 'Target');
      if (!target || xmlAttribute(tag, 'TargetMode').toLowerCase() === 'external') continue;
      const targetPath = normalizeZipPath(sourcePartPath ? zipDirectory(sourcePartPath) + target : target);
      if (!verification.file(targetPath)) throw new Error(`PPTX verification failed: missing relationship target ${targetPath}`);
    }
  }
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  return { blob: new Blob([buffer], { type: mimeMap.pptx }), pages: slides.length };
};

type SheetData = { file: string; sheet: string; rows: unknown[][] };

const readExcelFiles = async (files: File[]): Promise<SheetData[]> => {
  const XLSX = await import('xlsx');
  const data: SheetData[] = [];
  for (const file of files) {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true, cellNF: true });
    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
      data.push({ file: file.name, sheet: sheetName, rows });
    });
  }
  return data;
};

const mergeExcelFiles = async (files: File[], mode: MergeMode) => {
  const XLSX = await import('xlsx');
  const sources = await readExcelFiles(files);
  if (!sources.length) throw new Error('No worksheets found.');
  const workbook = XLSX.utils.book_new();
  const used = new Set<string>();
  if (mode === 'append') {
    const maxColumns = Math.max(...sources.map(source => source.rows.reduce((max, row) => Math.max(max, row.length), 0)), 0);
    const header = ['Source file', 'Source worksheet', ...Array.from({ length: maxColumns }, (_, index) => `Column ${index + 1}`)];
    const rows: unknown[][] = [header];
    sources.forEach(source => source.rows.forEach(row => rows.push([source.file, source.sheet, ...Array.from({ length: maxColumns }, (_, index) => row[index] ?? '')])));
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), uniqueName('Merged data', used));
  } else {
    files.forEach(file => {
      const fileSources = sources.filter(source => source.file === file.name);
      const rows: unknown[][] = [];
      fileSources.forEach((source, sourceIndex) => {
        if (fileSources.length > 1) {
          if (rows.length) rows.push([]);
          rows.push([`Source worksheet: ${source.sheet}`]);
        }
        rows.push(...source.rows);
        if (sourceIndex < fileSources.length - 1) rows.push([]);
      });
      const sheetName = uniqueName(safeName(file.name.replace(/\.(xlsx|xls)$/i, '')), used);
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), sheetName);
    });
  }
  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array', compression: true });
  const verification = XLSX.read(bytes, { type: 'array' });
  if (verification.SheetNames.length !== workbook.SheetNames.length) throw new Error('Excel verification failed.');
  return { blob: new Blob([bytes], { type: mimeMap.xlsx }), pages: verification.SheetNames.length };
};

const performMerge = (kind: MergeKind, files: File[], mode: MergeMode) => kind === 'pdf' ? mergePdfFiles(files) : kind === 'docx' ? mergeDocxFiles(files) : kind === 'pptx' ? mergePptxFiles(files) : mergeExcelFiles(files, mode);

const mergeCopy = (kind: MergeKind, language: Language): MergeCopy => copy[kind][language] || copy[kind].en;

export function MergeToolPage({ kind, language }: { kind: MergeKind; language: Language }) {
  const ui = mergeCopy(kind, language);
  const Icon = iconMap[kind];
  const [files, setFiles] = useState<MergeFile[]>([]);
  const [mode, setMode] = useState<MergeMode>('sheets');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ blob: Blob; pages: number; name: string } | null>(null);
  const accept = extensionMap[kind].join(',');
  const fileAccept = useMemo(() => extensionMap[kind], [kind]);

  const addFiles = (incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(file => fileAccept.some(extension => file.name.toLowerCase().endsWith(extension)));
    if (valid.length !== incoming.length) setError(language === 'zh' ? `只支持${fileAccept.join('、')}文件。` : `Only ${fileAccept.join(', ')} files are supported.`);
    setFiles(current => [...current, ...valid.map(file => ({ id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`, file }))]);
    setResult(null);
    setMessage('');
  };

  const move = (index: number, delta: -1 | 1) => {
    setFiles(current => {
      const target = index + delta;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setResult(null);
  };

  const merge = async () => {
    if (files.length < 2) {
      setError(language === 'zh' ? '至少选择2个文件后才能合并。' : 'Choose at least two files to merge.');
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    setResult(null);
    try {
      const merged = await performMerge(kind, files.map(item => item.file), mode);
      const suffix = kind === 'xlsx' ? 'xlsx' : kind;
      setResult({ blob: merged.blob, pages: merged.pages, name: `herdown-merged.${suffix}` });
      setMessage(ui.success(files.length, merged.pages));
    } catch (mergeError) {
      setError(mergeError instanceof Error ? mergeError.message : ui.error);
    } finally {
      setBusy(false);
    }
  };

  return <div className="mx-auto w-full max-w-6xl pb-20 pt-8">
    <div className="max-w-3xl">
      <span className="text-xs font-semibold text-emerald-400">{ui.eyebrow}</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{ui.title}</h1>
      <p className="mt-3 text-sm leading-7 text-slate-400">{ui.description}</p>
    </div>
    <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <section className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5" aria-labelledby="merge-files-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="merge-files-title" className="text-lg font-bold text-white">{ui.inputLabel}</h2><p className="mt-1 text-xs leading-6 text-slate-500">{ui.inputHint}</p></div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"><Upload className="h-4 w-4" />{ui.addFiles}<input className="sr-only" type="file" accept={accept} multiple onChange={event => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ''; }} /></label>
        </div>
        <label className="mt-5 flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#2b3b4d] bg-[#090d12] px-4 py-5 text-center hover:border-emerald-500/60"><Files className="h-7 w-7 text-emerald-400" /><span className="mt-2 text-sm font-semibold text-slate-200">{ui.addFiles}</span><span className="mt-1 text-xs text-slate-500">{ui.orderHint}</span><input className="sr-only" type="file" accept={accept} multiple onChange={event => { if (event.target.files) addFiles(event.target.files); event.currentTarget.value = ''; }} /></label>
        {files.length ? <div className="mt-5 space-y-2" aria-live="polite"><div className="flex items-center justify-between text-xs text-slate-500"><span>{ui.count(files.length)}</span><button type="button" onClick={() => { setFiles([]); setResult(null); setMessage(''); setError(''); }} className="inline-flex items-center gap-1 text-slate-400 hover:text-white"><Trash2 className="h-3.5 w-3.5" />{ui.clear}</button></div>{files.map((item, index) => <div key={item.id} className="flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#111823] p-3"><Icon className="h-5 w-5 shrink-0 text-emerald-400" /><span className="min-w-0 flex-1 truncate text-sm text-slate-200" title={item.file.name}>{index + 1}. {item.file.name}</span><button type="button" onClick={() => move(index, -1)} disabled={index === 0} className="rounded-md p-1.5 text-slate-500 hover:bg-[#1e293b] hover:text-white disabled:opacity-30" title={ui.moveUp} aria-label={ui.moveUp}><ArrowUp className="h-4 w-4" /></button><button type="button" onClick={() => move(index, 1)} disabled={index === files.length - 1} className="rounded-md p-1.5 text-slate-500 hover:bg-[#1e293b] hover:text-white disabled:opacity-30" title={ui.moveDown} aria-label={ui.moveDown}><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => { setFiles(current => current.filter(entry => entry.id !== item.id)); setResult(null); }} className="rounded-md p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-300" title={ui.remove} aria-label={ui.remove}><X className="h-4 w-4" /></button></div>)}</div> : <p className="mt-4 text-sm text-slate-500">{ui.empty}</p>}
        {kind === 'xlsx' && ui.modeTitle && <div className="mt-5 rounded-xl border border-[#1e293b] bg-[#111823] p-3"><h3 className="text-sm font-semibold text-slate-200">{ui.modeTitle}</h3><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className={`cursor-pointer rounded-lg border p-3 ${mode === 'sheets' ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-[#263548]'}`}><span className="flex items-center gap-2 text-xs font-semibold text-white"><input type="radio" name="excel-merge-mode" checked={mode === 'sheets'} onChange={() => setMode('sheets')} />{ui.modeSheets}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{ui.modeSheetsHint}</span></label><label className={`cursor-pointer rounded-lg border p-3 ${mode === 'append' ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-[#263548]'}`}><span className="flex items-center gap-2 text-xs font-semibold text-white"><input type="radio" name="excel-merge-mode" checked={mode === 'append'} onChange={() => setMode('append')} />{ui.modeAppend}</span><span className="mt-2 block text-xs leading-5 text-slate-500">{ui.modeAppendHint}</span></label></div></div>}
        <button type="button" onClick={() => void merge()} disabled={busy || files.length < 2} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileStack className="h-4 w-4" />}{busy ? ui.working : ui.mergeAction}</button>
        <p className="mt-3 text-xs leading-6 text-slate-500">{ui.fileNote}</p>
        <p className="mt-2 text-xs leading-6 text-amber-300/80">{ui.limitation}</p>
      </section>
      <section className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-4 sm:p-5" aria-labelledby="merge-result-title">
        <div className="flex items-center justify-between gap-3"><h2 id="merge-result-title" className="text-lg font-bold text-white">{ui.output}</h2><Icon className="h-5 w-5 text-emerald-400" /></div>
        {result ? <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"><CheckCircle2 className="h-6 w-6 text-emerald-400" /><p className="mt-3 text-sm leading-6 text-emerald-100">{message}</p><button type="button" onClick={() => downloadBlob(result.blob, result.name)} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-500"><Download className="h-4 w-4" />{ui.download}</button></div> : <div className="mt-5 rounded-xl border border-[#1e293b] bg-[#090d12] p-5"><Icon className="h-7 w-7 text-slate-600" /><p className="mt-3 text-sm leading-6 text-slate-500">{ui.empty}</p></div>}
        {error && <div className="mt-4 flex gap-2 rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-xs leading-6 text-red-200" role="alert"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        {message && !result && <p className="mt-4 text-xs leading-6 text-slate-400" role="status">{message}</p>}
      </section>
    </div>
    <div className="mt-8 grid gap-4 md:grid-cols-3"><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-white">{language === 'zh' ? '本地处理' : language === 'ja' ? 'ローカル処理' : language === 'es' ? 'Procesamiento local' : language === 'de' ? 'Lokale Verarbeitung' : 'Local processing'}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{language === 'zh' ? '文件在当前浏览器中读取和生成，不需要上传到Herdown。' : language === 'ja' ? 'ファイルはこのブラウザで読み取り、Herdownへアップロードしません。' : language === 'es' ? 'Los archivos se leen y generan en este navegador sin subirlos a Herdown.' : language === 'de' ? 'Dateien werden in diesem Browser gelesen und erzeugt, ohne Upload zu Herdown.' : 'Files are read and generated in this browser without uploading them to Herdown.'}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-white">{language === 'zh' ? '顺序可控' : language === 'ja' ? '順番を管理' : language === 'es' ? 'Control del orden' : language === 'de' ? 'Reihenfolge' : 'Order control'}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{language === 'zh' ? '合并前可以上移、下移或移除文件，结果顺序可检查。' : language === 'ja' ? '結合前にファイルを移動または削除し、出力順を確認できます。' : language === 'es' ? 'Puedes mover o quitar archivos antes de unirlos para controlar la salida.' : language === 'de' ? 'Verschiebe oder entferne Dateien vor dem Zusammenführen.' : 'Move or remove files before merging so the output order is explicit.'}</p></div><div className="rounded-xl border border-[#1e293b] bg-[#0d131c] p-4"><h3 className="text-sm font-semibold text-white">{language === 'zh' ? '结果可下载' : language === 'ja' ? '結果を保存' : language === 'es' ? 'Salida descargable' : language === 'de' ? 'Ladbare Ausgabe' : 'Downloadable output'}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{language === 'zh' ? '生成后会重新打开结果文件并核对结构，再提供下载。' : language === 'ja' ? '生成後に結果を確認してからダウンロードを有効にします。' : language === 'es' ? 'El archivo se comprueba antes de habilitar la descarga.' : language === 'de' ? 'Die erzeugte Datei wird vor dem Download geprüft.' : 'The generated file is checked before the download button is enabled.'}</p></div></div>
    {kind === 'pdf' ? <ToolSeoContent slug="merge-pdf" language={language} /> : kind === 'docx' ? <ToolSeoContent slug="merge-docx" language={language} /> : kind === 'pptx' ? <ToolSeoContent slug="merge-pptx" language={language} /> : <ToolSeoContent slug="merge-excel" language={language} />}
  </div>;
}
