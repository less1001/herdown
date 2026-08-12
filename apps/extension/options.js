const DEFAULT_DOWNLOAD_FOLDER = 'Herdown md';
const DEFAULT_OBSIDIAN_FOLDER = 'Herdown';
const defaults = { language: 'auto', downloadFolder: DEFAULT_DOWNLOAD_FOLDER, obsidianVault: '', obsidianFolder: DEFAULT_OBSIDIAN_FOLDER };
const elements = {
  language: document.getElementById('language'),
  downloadFolder: document.getElementById('download-folder'),
  vault: document.getElementById('vault'),
  folder: document.getElementById('folder'),
  status: document.getElementById('status')
};

const zh = { title: 'Herdown设置', subtitle: '设置剪藏保存方式', general: '基本设置', language: '界面语言', auto: '跟随浏览器', chinese: '中文', english: 'English', downloadFolder: '下载文件夹', downloadHint: '下载的Markdown会保存在这个文件夹下。', obsidian: 'Obsidian保存', vault: 'Vault名称', folder: '默认文件夹', obsidianHint: '可选。填写后，存入Obsidian会使用这里的Vault和文件夹。', save: '保存设置', saved: '设置已保存。' };
const en = { title: 'Herdown settings', subtitle: 'Configure clipping output', general: 'General', language: 'Interface language', auto: 'Follow browser', chinese: '中文', english: 'English', downloadFolder: 'Download folder', downloadHint: 'Markdown downloads are saved under this folder.', obsidian: 'Obsidian output', vault: 'Vault name', folder: 'Default folder', obsidianHint: 'Optional. These values are used when sending a clipping to Obsidian.', save: 'Save settings', saved: 'Settings saved.' };

function currentCopy() { return elements.language.value === 'en' || (elements.language.value === 'auto' && navigator.language.toLowerCase().startsWith('en')) ? en : zh; }
function applyCopy() {
  const copy = currentCopy();
  document.documentElement.lang = copy === en ? 'en' : 'zh-CN';
  document.title = copy.title;
  const labels = { title: copy.title, subtitle: copy.subtitle, 'general-title': copy.general, 'language-label': copy.language, 'download-folder-label': copy.downloadFolder, 'download-folder-hint': copy.downloadHint, 'obsidian-title': copy.obsidian, 'vault-label': copy.vault, 'folder-label': copy.folder, 'obsidian-hint': copy.obsidianHint, save: copy.save };
  Object.entries(labels).forEach(([id, value]) => { document.getElementById(id).textContent = value; });
  elements.language.options[0].textContent = copy.auto;
  elements.language.options[1].textContent = copy.chinese;
  elements.language.options[2].textContent = copy.english;
}

async function load() {
  const settings = { ...defaults, ...(await chrome.storage.sync.get(defaults)) };
  elements.language.value = settings.language;
  const downloadFolder = !settings.downloadFolder || ['Clippings', 'Herdown Clippings', 'Herdown'].includes(settings.downloadFolder)
    ? DEFAULT_DOWNLOAD_FOLDER
    : settings.downloadFolder;
  const obsidianFolder = !settings.obsidianFolder || ['Clippings', 'Herdown Clippings'].includes(settings.obsidianFolder)
    ? DEFAULT_OBSIDIAN_FOLDER
    : settings.obsidianFolder;
  elements.downloadFolder.value = downloadFolder;
  elements.vault.value = settings.obsidianVault;
  elements.folder.value = obsidianFolder;
  const updates = {};
  if (downloadFolder !== settings.downloadFolder) updates.downloadFolder = downloadFolder;
  if (obsidianFolder !== settings.obsidianFolder) updates.obsidianFolder = obsidianFolder;
  if (Object.keys(updates).length) await chrome.storage.sync.set(updates);
  applyCopy();
}

elements.language.addEventListener('change', applyCopy);
document.getElementById('save').addEventListener('click', async () => {
  await chrome.storage.sync.set({ language: elements.language.value, downloadFolder: elements.downloadFolder.value.trim() || DEFAULT_DOWNLOAD_FOLDER, obsidianVault: elements.vault.value.trim(), obsidianFolder: elements.folder.value.trim() || DEFAULT_OBSIDIAN_FOLDER });
  elements.status.textContent = currentCopy().saved;
  setTimeout(() => { elements.status.textContent = ''; }, 3000);
});
void load();
