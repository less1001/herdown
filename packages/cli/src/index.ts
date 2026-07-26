#!/usr/bin/env node
import { writeFileSync } from 'node:fs';

const target = process.argv[2];
if (!target) {
  process.stderr.write('Usage: mdforagents <url>\n');
  process.exit(1);
}

const apiBase = process.env.MDFORAGENTS_API ?? 'http://127.0.0.1:8787';
const outputIndex = process.argv.indexOf('-o');
const outputPath = outputIndex >= 0 ? process.argv[outputIndex + 1] : undefined;

const response = await fetch(`${apiBase}/v1/parse`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ url: target }),
});

if (!response.ok) {
  process.stderr.write(`Request failed: ${response.status}\n`);
  process.exit(1);
}

const result = (await response.json()) as { title: string; markdown: string; images: string[] };
const output = `# ${result.title}\n\n${result.markdown}\n`;

if (outputPath) {
  writeFileSync(outputPath, output);
}

process.stdout.write(`${output}\n`);
