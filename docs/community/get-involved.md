---
title: Community
sidebar_position: 1
description: Join the BubuStack community — contribute, get recognized, grow your role.
---
# Community

BubuStack is built in the open. We're a small project with big ambitions, and
we need contributors who want to build something meaningful.

## Where to find us

- **GitHub** — [bubustack](https://github.com/bubustack) organization. Code,
  issues, discussions, and examples all live here.
- **Discord** — [Join our server](https://discord.gg/bubustack) for real-time
  chat, questions, and collaboration.

## How to contribute

1. **Pick something** — Browse [open issues](https://github.com/bubustack/bobrapet/issues)
   or check the [Roadmap](roadmap.md) for what needs help.
2. **Fork & branch** — Work from a feature branch. Keep commits scoped.
3. **Test** — Add unit and integration tests. Use KinD for operator/transport changes.
4. **PR** — Reference the issue, include context. Reviews target 2 business days.

### Contribution areas

- **Operator** — Controllers, webhooks, CRDs, reconciliation logic.
- **Transports** — Bobravoz gRPC and new transport implementations.
- **SDK** — Go SDK, testing harnesses, new language SDKs.
- **Engrams & Impulses** — New reusable components for the catalog.
- **Docs & examples** — Tutorials, guides, production runbooks.
- **Bug fixes** — Triage, reproduce, fix. Always welcome.

### Coding standards

- Go: `gofmt`, `goimports`, `golangci-lint`.
- TypeScript/React: repo ESLint rules.
- YAML: deterministic, `kubectl apply --server-side` friendly.

## Contributor ladder

We follow an open contributor ladder modeled on CNCF practices:

| Role | How you get there | What you gain |
| --- | --- | --- |
| **Contributor** | Merge your first PR | Listed in CONTRIBUTORS, community recognition |
| **Reviewer** | Consistent quality contributions, domain knowledge | Review permissions, input on design decisions |
| **Maintainer** | Sustained contribution, trust from existing maintainers | Merge rights, release authority, project direction |

Early contributors shape the project. The people who show up now will have
outsized influence on where BubuStack goes.

## Security & responsible disclosure

Follow the project security policy in
[`SECURITY.md`](https://github.com/bubustack/website/blob/main/SECURITY.md).
Report vulnerabilities through the GitHub Security Advisory form:

- https://github.com/bubustack/bobrapet/security/advisories/new

Do not report vulnerabilities in public issues.

## Code of Conduct

We enforce the [Code of Conduct](https://github.com/bubustack/website/blob/main/CODE_OF_CONDUCT.md)
in every repo and channel. For moderation concerns, contact:

- community@bubustack.com
