---
title: Support Channels
sidebar_position: 3
description: How to get help with Bubustack, report bugs, and request production support.
---
# Support Channels

:::info Quick scan
- **Why**: Choose the right support path for your Bubustack deployment or contribution.
- **When**: Use this matrix when you need answers fast or want to escalate incidents responsibly.
- **How**: Determine urgency, pick the channel below, and include the requested diagnostics.
:::

Need help running Bubustack in production or unblocking a contribution? Choose the option that fits
your urgency and environment.

## Support matrix

| Channel | Best for | Expected response | What to include |
| --- | --- | --- | --- |
| GitHub Discussions | Architecture questions, design reviews, best practices | Community replies within 24–48h | Story/Engram manifests, cluster versions, screenshots |
| GitHub Issues | Bugs, regressions, missing docs | Maintainer triage weekly | Logs, `kubectl describe`, reproducible steps |
| Working groups | Feature planning, backlog grooming | Live discussion on published cadence | Agenda bullet, linked PRs/RFCs |
| Partner desk | Production SLAs, enterprise rollouts | Contractual SLA (4h or better) | Environment outline, business impact |
| Security inbox | Vulnerability reports | Acknowledgement within 1 business day | Impact summary, CVSS guess, reproduction |

## Community Support (Free)

- **GitHub Discussions** — Ideal for architecture questions, design feedback, or debugging tips with
  the community. Tag posts with `support` and include cluster details plus relevant Story manifests.
- **Issues** — File bugs in the relevant repository. Provide logs, version info, and reproduction
  steps. Maintainers triage weekly.
- **Community calls** — Bring questions to the live Q&A segment; recordings are published for async
  reference.

## Maintainer Support

Bubustack maintainers provide best-effort assistance for critical incidents:

- Mention `@bubustack/maintainers` in GitHub issues for urgent regressions.
- Share sanitized telemetry (StoryRun status, controller logs) via secure upload links supplied by
  the maintainers.
- Expect an acknowledgement within 24 hours and iterative collaboration until resolved.

## Enterprise and Partner Support

- Production SLAs, multi-cluster design reviews, and backlog alignment are available through
  Bubustack’s partner program. Reach out at `partners@bubustack.io`.
- Partners receive early access to transport betas and Engram certification labs.

## Security & Responsible Disclosure

- Report vulnerabilities privately to `security@bubustack.io`.
- Please include affected versions, impact, and reproduction details.
- Maintainers acknowledge within one business day and coordinate coordinated disclosure timelines.

## Additional Resources

- [Contribution Guide](contributing.md)
- [Transport Integrations](../transports/overview.md)
- [API Reference](../reference/api-reference.md)

Thank you for building the Bubustack ecosystem with us—we’re here to keep your workflows healthy.

## Next steps

- Join a [working group](get-involved.md#working-groups) to collaborate live.
- Track release cadence in the [community backlog](roadmap.md).
- Escalate product ideas through [Contribution pathways](contributing.md#proposal-workflow).
