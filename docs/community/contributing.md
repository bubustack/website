---
title: Contribution Guide
sidebar_position: 2
description: Contribute code, docs, Engrams, and transports to the Bubustack ecosystem.
---
# Contribution Guide

:::info Quick scan
- **Why**: Learn how to contribute Bubustack code, docs, transports, and Engram templates.
- **When**: Review this before opening an issue, RFC, or pull request.
- **How**: Follow the proposal workflow, coding standards, and working group touchpoints below.
:::

We welcome contributions across operators, SDKs, documentation, Engram templates, and example
Stories. This guide covers how to propose changes and what to expect from the review process.

## Contribution Areas

- **Bobrapet operator** — Controllers, webhooks, CRDs, and reconciliation logic.
- **Transport operators** — Bobravoz gRPC and new transports proposed by the community.
- **SDKs & tooling** — Go SDK, CLI, API clients, testing harnesses.
- **Engram catalog** — Reusable EngramTemplates, Story samples, transport bindings.
- **Documentation** — Tutorials, architectural deep dives, and production runbooks.

## Workflow

1. **Open an issue** — Describe the change, link related discussions, and tag the relevant component.
2. **Design first** — For sizable features, share a brief design doc or recorded walkthrough for
   feedback before writing code.
3. **Fork & branch** — Work from a feature branch. Keep commits scoped and well-described.
4. **Tests** — Add unit and integration tests where applicable. Use KinD-based workflows for
   operator or transport changes.
5. **Docs** — Update end-user docs and API reference alongside the change. Surface breaking changes
   in the changelog.
6. **Pull request** — Reference the issue, include screenshots or manifests if helpful, and tag the
   owning working group.

## Review Expectations

- Reviews target a two-business-day response time.
- Maintainers request context or changes inline; please respond or push follow-ups within a week.
- Once approved, maintainers merge the PR and trigger relevant release workflows (nightly builds,
  documentation deploys).

## Coding Standards

- Go code follows `gofmt`, `goimports`, and static analysis via `golangci-lint`.
- TypeScript/React code aligns with the repo ESLint rules.
- YAML manifests should stay deterministic (`kubectl apply --server-side` friendly).
- Prefer declarative configurations over imperative scripts whenever possible.

## Proposal workflow {#proposal-workflow}

| Step | Description | Working group touchpoint |
| --- | --- | --- |
| 1. Draft | Open an issue or GitHub Discussion summarising the problem and desired outcome. | Tag the relevant working group label (`operators`, `transport`, `sdk`, `catalog`). |
| 2. Review | Share design notes or RFCs two business days before the meeting where you want feedback. | Present during the next working group call or async thread. |
| 3. Implement | Build iteratively, keep PRs small, and link back to the tracked issue. | Request check-ins during the weekly async status thread. |
| 4. Demo & document | Record a short demo or update docs/runbooks so adopters can follow along. | Add a note to the community release recap. |
| 5. Celebrate | Recognise contributors in the Engram Builder spotlight and community updates. | Mention in the community call agenda. |

## Community Covenant

We enforce the [Code of Conduct](https://github.com/bubustack/.github/blob/main/CODE_OF_CONDUCT.md)
in every repo, call, and event. Report violations privately via `conduct@bubustack.io`. Respectful,
inclusive collaboration keeps the ecosystem healthy.

## Recognition

- Contributors appear in release notes and the documentation hall of fame.
- Working groups nominate standout contributors for quarterly “Engram Builder” spotlights during
  community calls.

Ready to jump in? Check the [issue tracker](https://github.com/bubustack/bobrapet/issues) for
“good first issue” and “help wanted” labels, or propose a new initiative in the community boards.

## Next steps

- Browse the community boards in [GitHub Discussions](https://github.com/bubustack/bobrapet/discussions) to see active initiatives.
- Join a [working group](get-involved.md#working-groups) aligned with your contribution area.
- Coordinate rollout or partner pilots through the [support matrix](support.md#support-matrix).
