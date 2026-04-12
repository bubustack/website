# Security policy

## Supported versions

This repository publishes the latest BubuStack website and documentation. For
runtime and operator security support, treat the latest released line of the
owning component repository as supported. Older releases and unreleased commits
are unsupported unless that repository's `SECURITY.md` says otherwise.

Supported Kubernetes versions follow the latest compatibility matrix published
by the owning component repository. For controller/runtime issues, use the
bobrapet release notes and CI matrix as the source of truth.

## Reporting a vulnerability

The BubuStack Team and community take all security vulnerabilities seriously.
Use the GitHub Security Advisory flow in the repository that owns the affected
code:

| Area | Security advisory intake |
| --- | --- |
| Website/docs build, Docusaurus site, repo workflows | https://github.com/bubustack/website/security/advisories/new |
| Workflow operator, CRDs, controllers, webhooks | https://github.com/bubustack/bobrapet/security/advisories/new |
| Streaming hub, connector injection, transport topology | https://github.com/bubustack/bobravoz-grpc/security/advisories/new |
| SDK behavior and runtime helper APIs | https://github.com/bubustack/bubu-sdk-go/security/advisories/new |
| Shared contracts, templating, transport envelopes | https://github.com/bubustack/core/security/advisories/new |
| Protobuf contracts and generated bindings | https://github.com/bubustack/tractatus/security/advisories/new |

For docs mistakes, stale content, broken links, or other non-security website
issues, open a normal issue or PR in `bubustack/website` instead of using the
security advisory flow.

**Please do not report security vulnerabilities through public GitHub issues.**

When reporting a vulnerability, please provide the following information:

- **A clear description** of the vulnerability and its potential impact.
- **Steps to reproduce** the vulnerability, including any example code, scripts, or configurations.
- **The version(s) of the affected component or repository**.
- **Your contact information** for us to follow up with you.

## Disclosure process

1.  **Report**: You report the vulnerability through the GitHub Security Advisory feature.
2.  **Confirmation**: We will acknowledge your report within 48 hours.
3.  **Investigation**: We will investigate the vulnerability and determine its scope and impact. We may contact you for additional information during this phase.
4.  **Fix**: We will develop a patch for the vulnerability.
5.  **Disclosure**: We will create a security advisory, issue a CVE (if applicable), and release a new version with the patch. We will credit you for your discovery unless you prefer to remain anonymous.

We aim to resolve high severity vulnerabilities within 30 days, medium within
60 days, and low within 90 days, subject to complexity and scope. We'll keep
you informed of progress.
