# Contributing to the BubuStack Website

Thanks for contributing.

This repository contains the public website and docs for BubuStack.
For operator/runtime code changes, use the relevant project repos:

- https://github.com/bubustack/bobrapet
- https://github.com/bubustack/bubu-sdk-go
- https://github.com/bubustack/bobravoz-grpc
- https://github.com/bubustack/examples

## What belongs here

- Documentation updates in `docs/`
- Homepage/content updates in `src/pages/` and `src/components/`
- Navigation and metadata updates in `sidebars.ts` and `docusaurus.config.ts`
- Root trust/governance docs (`SECURITY.md`, `SUPPORT.md`, `CODE_OF_CONDUCT.md`)

## Local setup

Prerequisites:

- Node.js 20+
- npm

```bash
npm install
npm start
```

## Validation before PR

Run these checks:

```bash
npm run typecheck
npm run build
```

If you changed docs content, verify:

- Links resolve (internal and external)
- Claims are factual and source-backed
- Planned features are clearly labeled as planned
- Security/contact guidance matches `SECURITY.md` and `CODE_OF_CONDUCT.md`

## Pull requests

1. Fork and create a branch from `main`.
2. Keep changes scoped and reviewable.
3. Include context in the PR description (what changed and why).
4. If user-facing behavior changed, include screenshots when helpful.

## Commit messages

Conventional Commits are preferred.

Examples:

- `docs: fix quickstart storage instructions`
- `feat: add observability runbook to sidebar`
- `chore: align website contributing guide with repo scope`

## Code of Conduct

Participation is governed by [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md).
Report moderation concerns to `community@bubustack.com`.
