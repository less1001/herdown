import { parseMarkdown, detectPlatform } from '../../core/src/index.js';
import fs from 'node:fs';
import path from 'node:path';

// Platforms that require their own Referer to serve images (hotlink protection)
const REFERER_MAP: Record<string, string> = {
  wechat:      'https://mp.weixin.qq.com/',
  xiaohongshu: 'https://www.xiaohongshu.com/',
  sspai:       'https://sspai.com/',
  zhihu:       'https://www.zhihu.com/',
};

// Download image to local file, returns local filename or null on failure
async function downloadImage(url: string, destDir: string, referer: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'referer': referer,
      },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    // Derive filename from URL path
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath).split('?')[0] || '.jpg';
    const basename = path.basename(urlPath, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(-40);
    const filename = `${basename}${ext}`;
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, filename), Buffer.from(buffer));
    return filename;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    console.log(`
 Herdown CLI (v0.2.7)
Usage: npx @herdown/cli <url> [-o output.md] [--limit 5] [--key <api_key>]
   or: herdown <url> [-o output.md]

Options:
  -o, --output <file>    Save Markdown result to specified file (images auto-downloaded for protected platforms)
  -l, --limit <number>   Max answers to extract for Q&A sites like Zhihu (default: 5)
  -k, --key <api_key>    Use custom API Key for request
  -h, --help             Show help message
    `);
    process.exit(0);
  }

  const urlArg = args[0];
  let outputFile = '';
  let maxAnswers = 5;
  let apiKey = 'sk_live_REDACTED';

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '-o' || args[i] === '--output') && args[i + 1]) {
      outputFile = args[i + 1];
      i++;
    } else if ((args[i] === '-l' || args[i] === '--limit') && args[i + 1]) {
      maxAnswers = parseInt(args[i + 1], 10) || 5;
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

  console.log(`[Herdown] Fetching & parsing URL: ${urlArg}`);

  const platform = detectPlatform(urlArg);
  const pageReferer = REFERER_MAP[platform] || 'https://www.google.com/';

  try {
    const res = await fetch(urlArg, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'referer': pageReferer,
      },
    });

    if (!res.ok) {
      console.error(`[Error] Target page returned status ${res.status}`);
      process.exit(1);
    }

    const html = await res.text();
    const result = parseMarkdown(html, urlArg);

    console.log(`[Herdown] Successfully parsed article "${result.title}" in ${result.elapsed_ms}ms`);

    if (outputFile) {
      let targetPath = outputFile;
      // If outputFile ends with / or is a directory, derive filename from article title
      if (fs.existsSync(outputFile) && fs.statSync(outputFile).isDirectory()) {
        const cleanTitle = (result.title || 'article').replace(/[/\\?%*:|"<>]/g, '_').trim();
        targetPath = path.join(outputFile, `${cleanTitle}.md`);
      }
      const resolvedPath = path.resolve(process.cwd(), targetPath);
      let fileContent = result.frontmatter
        ? `${result.frontmatter}\n\n# ${result.title}\n\n${result.markdown}`
        : result.markdown;

      // For platforms with hotlink-protected images, download images locally
      const imgReferer = REFERER_MAP[platform];
      if (imgReferer && result.images && result.images.length > 0) {
        const attachDir = path.join(path.dirname(resolvedPath), 'attachments');
        const downloaded: Record<string, string> = {};

        console.log(`[Herdown] Downloading ${result.images.length} image(s) for ${platform}...`);
        for (const imgUrl of result.images) {
          const localName = await downloadImage(imgUrl, attachDir, imgReferer);
          if (localName) {
            downloaded[imgUrl] = `attachments/${localName}`;
            process.stdout.write('.');
          } else {
            process.stdout.write('x');
          }
        }
        if (result.images.length > 0) console.log('');

        // Replace remote URLs with local paths in the markdown
        for (const [remote, local] of Object.entries(downloaded)) {
          const escapedUrl = remote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          fileContent = fileContent.replace(new RegExp(escapedUrl, 'g'), local);
        }
        console.log(`[Herdown] Images saved to ${attachDir}/`);
      }

      fs.writeFileSync(resolvedPath, fileContent, 'utf-8');
      console.log(`[Herdown] Saved Markdown to ${resolvedPath}`);
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
