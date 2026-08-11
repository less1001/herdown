# Herdown CLI

`@herdown/cli` converts a public webpage into Markdown from a terminal.

## Install and run

Run without a global install:

```bash
npx @herdown/cli "https://example.com/article"
```

Install globally:

```bash
npm install -g @herdown/cli
herdown "https://example.com/article"
```

Save the result:

```bash
herdown "https://example.com/article" --output article.md
```

## Modes

### Local mode

Without an API key, the CLI fetches the public page and parses it with the bundled parser. This keeps the parsing path independent of the Herdown hosted service for supported pages.

```bash
herdown "https://example.com/article" -o article.md
```

Local mode can be incomplete for login-required pages, JavaScript-only pages, blocked requests, or pages that need a specialized remote workflow.

### Remote mode

With an API key, the CLI sends the request to the Herdown API. Use this for managed platform parsing, repeatable automation, and account-based quotas.

```bash
export HERDOWN_API_URL="https://api.herdown.com"
export HERDOWN_API_KEY="YOUR_API_KEY"
herdown "https://example.com/article" --key "$HERDOWN_API_KEY" -o article.md
```

Create and manage keys in the [Herdown API console](https://herdown.com/api). Do not put a real key in a script committed to Git.

## Options

```text
-o, --output <file>    Save Markdown to a file
-l, --limit <number>   Maximum answers for supported Q&A pages
-k, --key <api_key>    Use the Herdown remote API
-h, --help             Show help
```

When the output path is a directory, the CLI derives a filename from the extracted title. Protected platform images may be downloaded to an `attachments` directory when an output file is requested.

## Examples

```bash
herdown "https://news.ycombinator.com" -o article.md
herdown "https://mp.weixin.qq.com/s/example" -o wechat.md
herdown "https://zhihu.com/question/example" --limit 10 -o answers.md
```

Only process public content that you are allowed to access and transform. Respect each platform's terms, copyright, privacy rules, and robots policy.

## Troubleshooting

- Invalid URL: use an `http://` or `https://` URL.
- HTTP error: check that the page is public and reachable from the current network.
- Incomplete output: try the remote mode, the browser extension, or the matching tool on [herdown.com](https://herdown.com/tools).
- Missing images: check the generated `attachments` directory and the source page's image permissions.

See the [CLI product page](https://herdown.com/cli), [developer documentation](https://herdown.com/docs), and [issue tracker](https://github.com/less1001/herdown/issues).
