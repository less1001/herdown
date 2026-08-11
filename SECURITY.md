# Security policy

## Reporting a vulnerability

Do not open a public issue for a security vulnerability.

Use the private vulnerability reporting feature on the [Herdown GitHub repository](https://github.com/less1001/herdown/security) when available. If it is unavailable, contact the maintainer through the [Herdown contact page](https://herdown.com/contact) and include the repository name, affected version, reproduction steps, and impact.

Do not include API keys, cookies, private URLs, private documents, or personal data in a report.

## Supported versions

Security fixes target the latest release on the default branch. Older releases may not receive backported fixes.

## Secret handling

- Keep API keys in environment variables or a secret manager.
- Never commit `.env` files, production credentials, cookies, or exported customer data.
- Rotate a credential immediately if it appears in a commit, issue, log, or build artifact.
