---
title: Site & Docs Changelog
sidebar_position: 5
description: Snapshot of the latest homepage and documentation restructuring work with links to key files.
---

# Site & Docs Changelog

:::info Quick scan
- **Why**: Understand the structural updates made to Bubustack’s marketing site and docs so you can review or build on them.
- **When**: Reference after content refreshes or before preparing release notes.
- **How**: Follow the linked files below to inspect copy, navigation, and reference changes.
:::

## 2024-05 Clarity refresh

- Refined the hero narrative and supporting CTA copy so founders, operators, and contributors see the Bobrapet + Engram catalog + transport storyline in one glance ([`src/pages/index.tsx`](https://github.com/bubustack/website/blob/main/src/pages/index.tsx)).
- Updated the value proposition strip to emphasize infrastructure-as-code language—modules, plans, applies, drift detection—without naming competitors ([`src/components/HomepageSections/ValueProps/index.tsx`](https://github.com/bubustack/website/blob/main/src/components/HomepageSections/ValueProps/index.tsx)).
- Re-aligned the documentation sidebar so Ecosystem content (including the Overview) leads the nav, keeping the mandated Ecosystem → Operator → Engrams → Stories → Transports → SDK → Reference → Community order intact ([`sidebars.ts`](https://github.com/bubustack/website/blob/main/sidebars.ts)).

## Homepage refresh

| Area | Highlights | Files |
| --- | --- | --- |
| Hero & CTA | One-sentence value proposition plus Bobrapet, Engram catalog, and transport storyline with dual CTAs. | [`src/pages/index.tsx`](https://github.com/bubustack/website/blob/main/src/pages/index.tsx) |
| Feature trio | Proof-point driven cards for GitOps control plane, reusable Engrams, and transport optionality. | [`src/components/HomepageFeatures/index.tsx`](https://github.com/bubustack/website/blob/main/src/components/HomepageFeatures/index.tsx) |
| Lifecycle narrative | Mermaid diagram and persona callouts mapping Git commit → StoryRun telemetry with community backlog cues. | [`src/components/HomepageSections/StoryFlow/index.tsx`](https://github.com/bubustack/website/blob/main/src/components/HomepageSections/StoryFlow/index.tsx) |
| Community strip | Working groups, discussions, and backlog updates emphasising GitOps-native collaboration. | [`src/components/HomepageSections/CommunitySpotlight/index.tsx`](https://github.com/bubustack/website/blob/main/src/components/HomepageSections/CommunitySpotlight/index.tsx) |

## Documentation overhaul

- Reframed the ecosystem narrative in [`docs/overview.md`](../overview.md) with a Kubernetes-native, infrastructure-as-code lexicon focused on declarative workflows.
- Expanded operator guidance across [`docs/operator/quickstart.md`](../operator/quickstart.md) and [`docs/operator/day-two-operations.md`](../operator/day-two-operations.md), including transport previews and runbooks.
- Elevated Engram workflow coverage in [`docs/engrams/overview.md`](../engrams/overview.md) and [`docs/engrams/authoring.md`](../engrams/authoring.md) with ABI checklists and publishing workflows.
- Refined Story, Impulse, and Primitive playbooks in [`docs/stories`](../stories/overview.md) with GitOps promotion checklists, transport cues, and debugging tips.
- Updated reference tables for CRDs, runtime configuration, and metrics in [`docs/reference`](../reference/api-reference.md) alongside the [`Go SDK`](../sdk/go-sdk.md).
- Strengthened community resources—support matrix and contribution pathways—across [`docs/community`](../community/get-involved.md).

## Navigation & IA

- Sidebar aligned to Ecosystem, Operator, Engrams, Stories, Transports, SDK, Reference, and Community sections in [`sidebars.ts`](https://github.com/bubustack/website/blob/main/sidebars.ts).
- Every doc opens with a **Why/When/How** quick scan and closes with “Next steps” breadcrumbs; each section adds diagrams, manifests, or tables for fast onboarding.

## Next steps

- Validate the static build locally with `npm run build` (or `yarn build`).
- Share feedback or follow-up tasks in [GitHub Discussions](https://github.com/bubustack/bobrapet/discussions).
- Propose future edits through [Contribution pathways](contributing.md).
