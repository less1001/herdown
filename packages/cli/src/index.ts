import { parseMarkdown, detectPlatform } from '../../core/src/index.js';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
MD for Agents CLI (v2.4.0)
Usage: npx mdforagents <url> [-o output.md] [--key <api_key>]

Options:
  -o, --output <file>    Save Markdown result to specified file
  -k, --key <api_key>    Use custom API Key for request
  -h, --help             Show help message
    `);
    process.exit(0);
  }

  const urlArg = args[0];
  let outputFile = '';
  let apiKey = 'sk_live_demo88888888';

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '-o' || args[i] === '--output') && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if ((args[i] === '-k' || args[i] === '--key') && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    }
  }

  if (!/^https?:\/\//i.test(urlArg)) {
    console.error('Error: Invalid URL format. Must start with http:// or https://');
    process.exit(1);
  }

  console.log(`[MD for Agents] Fetching & parsing URL: ${urlArg}`);

  const platform = detectPlatform(urlArg);
  const referer = platform === 'xiaohongshu' ? 'https://www.xiaohongshu.com/' : 'https://mp.weixin.qq.com/';

  try {
    const res = await fetch(urlArg, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'referer': referer,
      },
    });

    if (!res.ok) {
      console.error(`[Error] Target page returned status ${res.status}`);
      process.exit(1);
    }

    const html = await res.text();
    const result = parseMarkdown(html, urlArg);

    console.log(`[MD for Agents] Successfully parsed article "${result.title}" in ${result.elapsed_ms}ms`);

    if (outputFile) {
      const resolvedPath = path.resolve(process.cwd(), outputFile);
      const fileContent = result.frontmatter
        ? `${result.frontmatter}\n\n# ${result.title}\n\n${result.markdown}`
        : result.markdown;
      fs.writeFileSync(resolvedPath, fileContent, 'utf-8');
      console.log(`[MD for Agents] Saved Markdown to ${resolvedPath}`);
    } else {
      console.log('\n--- MARKDOWN OUTPUT ---\n');
      console.log(result.markdown);
      console.log('\n-----------------------\n');
    }
  } catch (err: any) {
    console.error(`[Error] Failed to process URL: ${err?.message || err}`);
    process.exit(1);
  }
}

main();
