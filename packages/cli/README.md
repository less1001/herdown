# @herdown/cli

Convert a public webpage into clean Markdown from a terminal.

## Install

```bash
npx @herdown/cli "https://example.com/article"
```

Or install globally:

```bash
npm install -g @herdown/cli
herdown "https://example.com/article" -o article.md
```

## Local and remote modes

Without an API key, the bundled parser runs locally. With `--key`, the CLI sends the request to the Herdown API for hosted parsing and account-based quotas.

```bash
herdown "https://example.com/article" -o article.md
herdown "https://example.com/article" --key "$HERDOWN_API_KEY" -o article.md
```

See the full [CLI guide](../../docs/cli.md) and the [Herdown CLI page](https://herdown.com/cli).

## License

MIT. See the repository [LICENSE](../../LICENSE).
