const DEFAULT_DOWNLOAD_FOLDER = 'Herdown Clippings';
const DEFAULT_TEMPLATE = `---
title: "{{title}}"
source: "{{url}}"
author: "{{author}}"
published: "{{published}}"
created: "{{date}}"
description: "{{description}}"
tags:
  - clippings
---`;
const LEGACY_DEFAULT_TEMPLATE = `---
title: "{{title}}"
source_url: "{{url}}"
domain: "{{domain}}"
tags: [herdown, clippings]
---`;

const elements = {
  language: document.getElementById('language'),
  downloadFolder: document.getElementById('download-folder'),
  vault: document.getElementById('vault'),
  folder: document.getElementById('folder'),
  template: document.getElementById('template'),
  status: document.getElementById('status')
};

const zh = {
  title: 'Herdown设置', subtitle: '设置网页剪藏和Obsidian保存方式', general: '基本设置', language: '界面语言', follow: '跟随浏览器', chinese: '中文', english: 'English', downloadFolder: '下载文件夹', downloadHint: '下载的Markdown文件会保存在这个文件夹下。', obsidian: 'Obsidian保存', vault: 'Vault名称，可选', folder: '默认文件夹，可选', obsidianHint: '填写后，发送到Obsidian时会使用指定Vault和文件夹。', template: 'Markdown模板', templateLabel: 'Frontmatter模板', templateHint: '可用变量：{{title}}、{{url}}、{{domain}}、{{date}}、{{author}}、{{published}}、{{description}}。保留默认模板即可获得完整剪藏属性。', save: '保存设置', saved: '设置已保存。'
};
const en = {
  title: 'Herdown settings', subtitle: 'Configure clipping and Obsidian output', general: 'General', language: 'Interface language', follow: 'Follow browser', chinese: '中文', english: 'English', downloadFolder: 'Download folder', downloadHint: 'Markdown files are saved under this folder.', obsidian: 'Obsidian output', vault: 'Vault name, optional', folder: 'Default folder, optional', obsidianHint: 'When set, Send to Obsidian uses this vault and folder.', template: 'Markdown template', templateLabel: 'Frontmatter template', templateHint: 'Variables: {{title}}, {{url}}, {{domain}}, {{date}}, {{author}}, {{published}}, {{description}}. Keep the default template for complete clipping properties.', save: 'Save settings', saved: 'Settings saved.'
};

function getLanguage(value) {
  if (value === 'en' || (value === 'auto' && navigator.language.toLowerCase().startsWith('en'))) return 'en';
  return 'zh';
}

function applyLocale() {
  const copy = getLanguage(elements.language.value) === 'en' ? en : zh;
  document.documentElement.lang = copy === en ? 'en' : 'zh-CN';
  const textMap = {
    title: copy.title, subtitle: copy.subtitle, 'general-title': copy.general, 'language-label': copy.language,
    'download-folder-label': copy.downloadFolder, 'download-folder-hint': copy.downloadHint, 'obsidian-title': copy.obsidian,
    'vault-label': copy.vault, 'folder-label': copy.folder, 'obsidian-hint': copy.obsidianHint, 'template-title': copy.template,
    'template-label': copy.templateLabel, 'template-hint': copy.templateHint, save: copy.save
  };
  for (const [id, value] of Object.entries(textMap)) document.getElementById(id).textContent = value;
  const languageOptions = elements.language.options;
  languageOptions[0].textContent = copy.follow;
  languageOptions[1].textContent = copy.chinese;
  languageOptions[2].textContent = copy.english;
}

async function load() {
  const settings = await chrome.storage.sync.get({
    language: 'auto', downloadFolder: DEFAULT_DOWNLOAD_FOLDER, obsidianVault: '', obsidianFolder: '', template: DEFAULT_TEMPLATE
  });
  if (settings.downloadFolder === 'Clippings') {
    settings.downloadFolder = DEFAULT_DOWNLOAD_FOLDER;
    await chrome.storage.sync.set({ downloadFolder: DEFAULT_DOWNLOAD_FOLDER });
  }
  const repairedTemplate = normalizeStoredTemplate(settings.template);
  if (repairedTemplate !== settings.template) {
    settings.template = repairedTemplate;
    await chrome.storage.sync.set({ template: repairedTemplate });
  }
  elements.language.value = settings.language;
  elements.downloadFolder.value = settings.downloadFolder;
  elements.vault.value = settings.obsidianVault;
  elements.folder.value = settings.obsidianFolder;
  elements.template.value = settings.template;
  applyLocale();
}

elements.language.addEventListener('change', applyLocale);
document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({
    language: elements.language.value,
    downloadFolder: elements.downloadFolder.value.trim() || DEFAULT_DOWNLOAD_FOLDER,
    obsidianVault: elements.vault.value.trim(),
    obsidianFolder: elements.folder.value.trim(),
    template: elements.template.value.trim()
  });
  const copy = getLanguage(elements.language.value) === 'en' ? en : zh;
  elements.status.textContent = copy.saved;
  setTimeout(() => { elements.status.textContent = ''; }, 3000);
});

elements.template.value = DEFAULT_TEMPLATE;
void load();

function repairFrontmatterTemplate(template) {
  if (!template) return template;
  return String(template)
    .replace(/\r\n?/g, '\n')
    .replace(/^(\s*[A-Za-z0-9_-]+):\+/gm, '$1: ')
    .replace(/^(\s*)\+{2,}-?\s*/gm, '$1  - ');
}

function normalizeStoredTemplate(template) {
  const repaired = repairFrontmatterTemplate(template);
  if (!repaired) return repaired;

  const original = String(template);
  const normalized = repaired.trim();
  const hasLegacySyntax = /(?:^|\n)\s*(?:[A-Za-z0-9_-]+):\+|(?:^|\n)\s*\+{2,}/m.test(original);
  const hasDefaultFields = [
    'title: "{{title}}"',
    'source: "{{url}}"',
    'author: "{{author}}"',
    'published: "{{published}}"',
    'created: "{{date}}"',
    'description: "{{description}}"',
    'tags:',
    '  - clippings'
  ].every((field) => normalized.includes(field));
  const hasLegacyFields = [
    'title: "{{title}}"',
    'source_url: "{{url}}"',
    'domain: "{{domain}}"',
    'tags: [herdown, clippings]'
  ].every((field) => normalized.includes(field));
  const hasGeneratedValues = [
    /(?:^|\n)\s*title:\s*"(?!\{\{title\}\})/,
    /(?:^|\n)\s*source(?:_url)?:\s*"(?!\{\{url\}\})/,
    /(?:^|\n)\s*(?:author|published|created|description):\s*"/
  ].every((pattern) => pattern.test(normalized));

  if (hasDefaultFields || hasLegacyFields || (hasLegacySyntax && hasGeneratedValues)) return DEFAULT_TEMPLATE;
  return repaired;
}
