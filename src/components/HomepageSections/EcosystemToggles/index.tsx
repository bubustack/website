import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

type Toggle = {
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
  cta?: {
    label: string;
    to: string;
  };
};

const toggles: Toggle[] = [
  {
    eyebrow: 'Bobrapet Operator',
    title: 'Reconcile every Story like infrastructure.',
    summary:
      'Install once, register CRDs, and let GitOps controllers drive Stories, StepRuns, and Impulses with admission-guarded safety.',
    bullets: [
      'Ships with StoryRun + StepRun controllers, transport adapters, and telemetry surfaces.',
      'Compatible with Argo CD, Flux, and Faros thanks to standard manifests.',
      'Policy bundles enforce CEL validation, resource quotas, and runtime profiles.',
    ],
    cta: {
      label: 'Operator quickstart',
      to: '/docs/operator/quickstart',
    },
  },
  {
    eyebrow: 'Reusable Engrams',
    title: 'Package AI skills behind an ABI.',
    summary:
      'EngramTemplates define schema, transport expectations, and runtime class so teams publish once and promote everywhere.',
    bullets: [
      'SDK-driven scaffolds for Go today; additional language SDKs open when the community prioritizes them.',
      'Supports short-lived Jobs, long-lived Deployments, or StatefulSets with autoscaling hints.',
      'Catalog governance keeps semantic versions compatible across clusters.',
    ],
    cta: {
      label: 'Engram authoring guide',
      to: '/docs/engrams/authoring',
    },
  },
  {
    eyebrow: 'Stories & Transports',
    title: 'Compose flows and choose your data plane.',
    summary:
      'Stories stitch Engrams with primitives. Bobravoz gRPC is production-ready today, and new transports inherit the same spec when the community submits adapters.',
    bullets: [
      'Primitives cover conditionals, fan-out, loops, retries, and manual approval gates.',
      'Transport selection is declarative per Story and traceable in Git history.',
      'Telemetry streams (metrics/logs/traces) align to OpenTelemetry and Prometheus.',
    ],
    cta: {
      label: 'Story design patterns',
      to: '/docs/stories/patterns',
    },
  },
];

export default function EcosystemToggles(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>Bubustack Ecosystem</span>
          <h2 className={styles.title}>
            Open the boxes you need, keep the rest tucked away until launch.
          </h2>
          <p className={styles.subtitle}>
            Every part of the stack remains available, but the details stay collapsed until you
            check the box—perfect while we iterate in the open.
          </p>
        </header>
        <div className={styles.grid}>
          {toggles.map(toggle => (
            <details key={toggle.title} className={styles.card}>
              <summary className={styles.summary}>
                <span className={styles.checkbox} aria-hidden="true" />
                <div className={styles.summaryText}>
                  <span className={styles.cardEyebrow}>{toggle.eyebrow}</span>
                  <h3 className={styles.cardTitle}>{toggle.title}</h3>
                  <p className={styles.cardSummary}>{toggle.summary}</p>
                </div>
              </summary>
              <ul className={styles.list}>
                {toggle.bullets.map(point => (
                  <li key={point} className={styles.listItem}>
                    {point}
                  </li>
                ))}
              </ul>
              {toggle.cta && (
                <Link className={clsx('button button--sm', styles.cta)} to={toggle.cta.to}>
                  {toggle.cta.label}
                </Link>
              )}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
