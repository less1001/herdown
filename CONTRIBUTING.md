# Contributing to Herdown

Thank you for helping improve Herdown.

## Before opening an issue

- Search existing issues and pull requests.
- Use a safe public URL or a small synthetic fixture.
- Remove API keys, cookies, private documents, and personal data.
- Describe the input, expected output, actual output, and environment.

## Local checks

```bash
pnpm install
pnpm check
pnpm build
```

Changes to the parser should include a focused fixture or a reproducible test case. Changes to the web application should be checked in a real browser at desktop and mobile widths. Changes to an API route should be tested against the relevant local or public endpoint before a pull request is marked ready.

## Pull requests

Keep each pull request focused. Explain:

1. What changed
2. Why it changed
3. How it was tested
4. Any compatibility or privacy impact

Do not include generated build output, local credentials, customer content, or unrelated workspace files.

## Scope and responsibility

Contributors are responsible for respecting the terms, copyright, privacy rules, and access controls of the pages and files they process. A parser feature must not be described as permission to access protected content.
