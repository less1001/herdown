import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(scriptDir, '../../..');
const extensionRoot = path.join(repoRoot, 'apps/extension');
const outputPath = path.join(webRoot, 'public/downloads/herdown-extension.zip');
async function walkFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(absolutePath));
      continue;
    }
    if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

async function main() {
  const zip = new JSZip();
  const files = await walkFiles(extensionRoot);

  for (const absolutePath of files) {
    const relativePath = path.relative(extensionRoot, absolutePath).split(path.sep).join('/');
    const content = await fs.readFile(absolutePath);
    zip.file(relativePath, content);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  await fs.writeFile(outputPath, buffer);
  console.log(`Created ${path.relative(repoRoot, outputPath)} from ${files.length} files`);
}

main().catch(error => {
  console.error('Failed to build extension zip:', error);
  process.exitCode = 1;
});
