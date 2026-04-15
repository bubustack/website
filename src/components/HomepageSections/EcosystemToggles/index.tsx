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
      'Install once, register CRDs, and let your GitOps controller drive Stories, StepRuns, and Impulses with webhook-validated safety.',
    bullets: [
      'StoryRun, StepRun, Engram, Impulse, and Transport controllers.',
      'Works with Argo CD, Flux, or any tool that applies Kubernetes manifests.',
      'Admission webhooks validate schemas, immutability constraints, and references.',
    ],
    cta: {
      label: 'Operator quickstart',
      to: '/docs/getting-started/quickstart',
    },
  },
  {
    eyebrow: 'Engrams & Impulses',
    title: 'Package capabilities behind a stable interface.',
    summary:
      'Engrams process data. Impulses trigger workflows from external events. Both are defined as templates with schema validation, and today users install them from published GitHub Release assets.',
    bullets: [
      'Go SDK for batch, streaming, and trigger (Impulse) workloads.',
      'Current public catalog: 13 Engrams and 4 Impulses.',
      'Install current templates directly today; registry-backed discovery comes later.',
    ],
    cta: {
      label: 'Install current catalog',
      to: '/docs/getting-started/installing-components',
    },
  },
  {
    eyebrow: 'Stories & Transports',
    title: 'Compose DAGs and choose your data plane.',
    summary:
      'Stories wire Engrams into workflows with conditions, parallel execution, retries, and approval gates. Bobravoz gRPC provides the streaming transport.',
    bullets: [
      'Primitives: conditions, parallel, sleep, stop, executeStory, gate, wait.',
      'Transport selection is declarative per Story — traceable in Git.',
      'OpenTelemetry traces and Prometheus metrics across the pipeline.',
    ],
    cta: {
      label: 'Streaming contract',
      to: '/docs/streaming/streaming-contract',
    },
  },
];

export default function EcosystemToggles(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <header className={styles.header}>
          <span className={styles.eyebrow}>BubuStack Ecosystem</span>
          <h2 className={styles.title}>
            Three components. One platform.
          </h2>
          <p className={styles.subtitle}>
            Each piece works independently. Together they form a complete AI workflow platform on Kubernetes.
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
