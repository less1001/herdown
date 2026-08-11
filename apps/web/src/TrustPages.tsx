import React from 'react';
import type { Language } from './i18n';

type TrustCopy = {
  eyebrow: string;
  title: string;
  intro: string;
  sections: Array<{ title: string; text: string; items?: string[] }>;
  actionLabel: string;
};

const copy: Record<'about' | 'contact', Record<Language, TrustCopy>> = {
  about: {
    zh: { eyebrow: '关于Herdown', title: '把资料整理成可以继续使用的Markdown', intro: 'Herdown提供网页、文档和本地文件工具，帮助个人用户、开发者和AI工作流减少格式整理成本。', sections: [{ title: '产品方向', text: 'Herdown把转换、预览、合并和发布拆成独立页面。每个页面都说明输入格式、输出结果、限制条件和隐私边界，方便在使用前做出判断。' }, { title: '本地优先', text: 'Markdown Viewer、文件转换、Markdown输出和文件合并工具尽量在当前浏览器中处理。文件不会因为打开工具就自动上传到Herdown。' }, { title: '开发者入口', text: '需要自动化时，可以从开发者文档进入API、MCP、CLI、Skill和浏览器插件。网页工具适合快速处理，开发者入口适合接入已有工作流。' }], actionLabel: '查看工具中心' },
    en: { eyebrow: 'About Herdown', title: 'Turn source material into Markdown you can keep using', intro: 'Herdown provides webpage, document, and local-file tools for people, developers, and AI workflows that need less format cleanup.', sections: [{ title: 'Product direction', text: 'Herdown separates conversion, preview, merging, and publishing into focused pages. Each page explains its inputs, output, limits, and privacy boundary before you use it.' }, { title: 'Local first', text: 'Markdown Viewer, file conversion, Markdown output, and merge tools process files in the current browser whenever possible. Opening a tool does not automatically upload a file to Herdown.' }, { title: 'Developer entry points', text: 'For automation, use the developer documentation for the API, MCP, CLI, Skill, and browser extension. Web tools are for quick jobs; developer entry points fit existing workflows.' }], actionLabel: 'Open the tools hub' },
    ja: { eyebrow: 'Herdownについて', title: '資料を使い続けられるMarkdownに整える', intro: 'Herdownは個人、開発者、AIワークフロー向けに、Webページ、文書、ローカルファイルを扱うツールを提供します。', sections: [{ title: '製品の方向性', text: '変換、プレビュー、結合、公開を目的別のページに分けています。各ページで入力、出力、制限、プライバシーを確認できます。' }, { title: 'ローカル優先', text: 'Markdown Viewer、ファイル変換、Markdown出力、ファイル結合は可能な限り現在のブラウザで処理します。ツールを開いただけでファイルをHerdownへ送信しません。' }, { title: '開発者向け入口', text: '自動化には開発者ドキュメントからAPI、MCP、CLI、Skill、ブラウザ拡張機能を利用できます。' }], actionLabel: 'ツール一覧を見る' },
    es: { eyebrow: 'Sobre Herdown', title: 'Convierte tus materiales en Markdown reutilizable', intro: 'Herdown ofrece herramientas para páginas web, documentos y archivos locales dirigidas a personas, desarrolladores y flujos de IA.', sections: [{ title: 'Dirección del producto', text: 'La conversión, la vista previa, la unión y la publicación tienen páginas enfocadas. Cada página explica entradas, salida, límites y privacidad antes de usarla.' }, { title: 'Prioridad local', text: 'Markdown Viewer, conversión, exportación y unión procesan los archivos en este navegador cuando es posible. Abrir una herramienta no sube automáticamente tus archivos.' }, { title: 'Entradas para desarrolladores', text: 'Para automatizar, consulta la documentación de API, MCP, CLI, Skill y extensión del navegador.' }], actionLabel: 'Abrir el centro de herramientas' },
    de: { eyebrow: 'Über Herdown', title: 'Materialien in weiterverwendbares Markdown umwandeln', intro: 'Herdown bietet Werkzeuge für Webseiten, Dokumente und lokale Dateien für Menschen, Entwickler und AI-Workflows.', sections: [{ title: 'Produktrichtung', text: 'Konvertierung, Vorschau, Zusammenführen und Veröffentlichung haben eigene Seiten. Jede Seite erklärt Eingaben, Ausgabe, Grenzen und Datenschutz.' }, { title: 'Lokal zuerst', text: 'Markdown-Viewer, Dateikonvertierung, Markdown-Ausgabe und Zusammenführen verarbeiten Dateien möglichst in diesem Browser. Das Öffnen eines Tools lädt Dateien nicht automatisch hoch.' }, { title: 'Einstieg für Entwickler', text: 'Für Automatisierung stehen API, MCP, CLI, Skill und Browser-Erweiterung in der Entwicklerdokumentation bereit.' }], actionLabel: 'Werkzeugzentrum öffnen' },
  },
  contact: {
    zh: { eyebrow: '联系Herdown', title: '告诉我们你遇到的问题', intro: '如果转换结果、页面功能、隐私边界或开发者接入有问题，可以通过邮箱联系Herdown。', sections: [{ title: '产品和转换问题', text: '请附上工具页面地址、输入文件类型、浏览器名称和可以复现问题的步骤。不要发送包含密码、API密钥或敏感个人信息的文件。' }, { title: '开发者合作', text: 'API、MCP、CLI、浏览器插件和内容处理场景可以在邮件中说明使用目标、预期输入和输出格式。' }, { title: '隐私提醒', text: '联系邮件中请只提供定位问题所需的信息。Herdown不会要求你发送密码、支付凭证中的完整敏感信息或私有文档原文。' }], actionLabel: '发送邮件' },
    en: { eyebrow: 'Contact Herdown', title: 'Tell us what needs attention', intro: 'Contact Herdown about conversion results, page behavior, privacy boundaries, or developer integrations.', sections: [{ title: 'Product and conversion issues', text: 'Include the tool URL, input file type, browser name, and reproducible steps. Do not send passwords, API keys, or sensitive personal files.' }, { title: 'Developer collaboration', text: 'For API, MCP, CLI, browser extension, or content workflows, describe the goal and expected input and output formats.' }, { title: 'Privacy reminder', text: 'Only include information needed to locate the issue. Herdown will not ask for passwords, full sensitive payment details, or private document contents.' }], actionLabel: 'Send an email' },
    ja: { eyebrow: 'Herdownへの連絡', title: '問題をお知らせください', intro: '変換結果、ページの動作、プライバシー、開発者連携についてお問い合わせください。', sections: [{ title: '製品と変換の問題', text: 'ツールのURL、入力形式、ブラウザ名、再現手順を記載してください。パスワード、APIキー、機密ファイルは送らないでください。' }, { title: '開発者連携', text: 'API、MCP、CLI、ブラウザ拡張機能、コンテンツ処理について、目的と入力・出力形式を説明してください。' }, { title: 'プライバシーの注意', text: '問題の確認に必要な情報だけを送ってください。パスワードや機密文書の全文を求めることはありません。' }], actionLabel: 'メールを送る' },
    es: { eyebrow: 'Contactar con Herdown', title: 'Cuéntanos qué necesita atención', intro: 'Escribe a Herdown sobre resultados de conversión, funcionamiento, privacidad o integraciones para desarrolladores.', sections: [{ title: 'Problemas de producto y conversión', text: 'Incluye la URL de la herramienta, el tipo de archivo, el navegador y los pasos para reproducirlo. No envíes contraseñas, claves API ni archivos sensibles.' }, { title: 'Colaboración técnica', text: 'Para API, MCP, CLI, extensión del navegador o flujos de contenido, describe el objetivo y los formatos esperados.' }, { title: 'Aviso de privacidad', text: 'Incluye solo la información necesaria para localizar el problema. No pediremos contraseñas ni el contenido completo de documentos privados.' }], actionLabel: 'Enviar un correo' },
    de: { eyebrow: 'Herdown kontaktieren', title: 'Teile uns dein Problem mit', intro: 'Kontaktiere Herdown bei Fragen zu Konvertierung, Seitenverhalten, Datenschutz oder Entwicklerintegrationen.', sections: [{ title: 'Produkt- und Konvertierungsprobleme', text: 'Nenne die Tool-URL, den Dateityp, den Browser und reproduzierbare Schritte. Sende keine Passwörter, API-Schlüssel oder vertraulichen Dateien.' }, { title: 'Zusammenarbeit für Entwickler', text: 'Beschreibe bei API, MCP, CLI, Browser-Erweiterung oder Content-Workflows das Ziel sowie erwartete Eingabe- und Ausgabeformate.' }, { title: 'Datenschutzhinweis', text: 'Übermittle nur die zur Fehleranalyse nötigen Angaben. Wir fragen nicht nach Passwörtern oder vollständigen privaten Dokumenten.' }], actionLabel: 'E-Mail senden' },
  },
};

export function TrustPage({ kind, language }: { kind: 'about' | 'contact'; language: Language }) {
  const page = copy[kind][language];
  const actionLabel = kind === 'about' ? page.actionLabel : page.actionLabel;
  return <main className="mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
    <div className="max-w-3xl">
      <span className="text-xs font-semibold text-emerald-400">{page.eyebrow}</span>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{page.title}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-400">{page.intro}</p>
    </div>
    <div className="mt-8 grid gap-4 md:grid-cols-3">
      {page.sections.map(section => <section key={section.title} className="rounded-2xl border border-[#1e293b] bg-[#0d131c] p-5"><h2 className="text-lg font-bold text-white">{section.title}</h2><p className="mt-3 text-sm leading-7 text-slate-400">{section.text}</p>{section.items && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">{section.items.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}
    </div>
    {kind === 'contact' ? <a href="mailto:vkdefi@gmail.com?subject=Herdown%20support" className="mt-8 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500">{actionLabel}</a> : <a href="/tools" className="mt-8 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500">{actionLabel}</a>}
  </main>;
}
