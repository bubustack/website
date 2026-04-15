import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

type ValueCard = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  cta?: {
    label: string;
    to: string;
  };
  highlights: string[];
};

const valueCards: ValueCard[] = [
  {
    eyebrow: 'Infrastructure as Code',
    title: 'Declare workflows, deploy with kubectl.',
    description:
      'Stories, Engrams, and Impulses are Kubernetes CRDs. Apply them with your GitOps controller. The Bobrapet operator reconciles the rest — scheduling, retries, timeouts, and transport wiring.',
    cta: {
      label: 'Launch the Quickstart',
      to: '/docs/getting-started/quickstart',
    },
    highlights: [
      'Drift detection and rollout via standard Kubernetes reconciliation',
      'Admission webhooks validate schemas before anything runs',
      'ConfigMap-based operator tuning — no proprietary config layer',
    ],
  },
  {
    eyebrow: 'Reusable Modules',
    title: 'Build once, use everywhere.',
    description:
      'EngramTemplates define inputs, outputs, and runtime requirements with JSON Schema. Version them, promote across environments, and distribute them through Git today. `bubu-registry` and the `bubu` CLI now cover registry-backed discovery and install flows; richer package guarantees are still roadmap work.',
    cta: {
      label: 'Create an Engram',
      to: '/docs/sdk/building-engrams',
    },
    highlights: [
      'Supports Job, Deployment, and StatefulSet runtimes',
      'Go SDK with testkit and conformance suites',
      'Versioned promotion keeps staging and prod in sync',
    ],
  },
  {
    eyebrow: 'State & Telemetry',
    title: 'Observe every run with traces, metrics, and structured errors.',
    description:
      'StoryRuns and StepRuns emit OpenTelemetry traces and structured error reports. Payload offloading to S3-compatible storage keeps large outputs out of etcd.',
    cta: {
      label: 'View observability docs',
      to: '/docs/observability/overview',
    },
    highlights: [
      'OpenTelemetry trace propagation through the entire pipeline',
      'Structured error contract with exit codes and retry classification',
      'S3-compatible storage offloading for payloads and logs',
    ],
  },
];

export default function ValueProps(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Why BubuStack</span>
          <h2 className={styles.title}>
            Kubernetes-native AI workflows. No proprietary runtime. No lock-in.
          </h2>
          <p className={styles.subtitle}>
            BubuStack is CRDs, controllers, and a Go SDK. Everything is declarative, everything lives
            in Git, and every component is replaceable.
          </p>
        </div>
        <div className={styles.cardGrid}>
          {valueCards.map(card => (
            <article key={card.title} className={styles.card}>
              <div className={styles.cardGlow} aria-hidden="true" />
              <header className={styles.cardHeader}>
                <span className={styles.cardEyebrow}>{card.eyebrow}</span>
                <h3 className={styles.cardTitle}>{card.title}</h3>
              </header>
              <p className={styles.cardDescription}>{card.description}</p>
              <ul className={styles.highlightList}>
                {card.highlights.map(item => (
                  <li key={item} className={styles.highlightItem}>
                    <span className={styles.bullet} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              {card.cta && (
                <Link
                  className={clsx('button button--sm', styles.cardCta)}
                  to={card.cta.to}>
                  {card.cta.label}
                </Link>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
