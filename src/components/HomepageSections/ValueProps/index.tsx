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
    title: 'Brainstorm flows like a studio, deploy them like Kubernetes.',
    description:
      'Sketch automations quickly, remix templates, and still land every change in Git with reviewable diffs. Bobrapet reconciles Stories, Engrams, and Impulses as CRDs so the experience feels like a whiteboard but ships with Terraform-grade rigor.',
    cta: {
      label: 'Launch the Quickstart',
      to: '/docs/operator/quickstart',
    },
    highlights: [
      'Controller-managed drift detection and rollout policies for StoryRuns',
      'Policy-as-code guardrails via CEL and admission webhooks',
      'Median reconcile under 3 seconds across preview clusters',
    ],
  },
  {
    eyebrow: 'Reusable Modules',
    title: 'Publish automation building blocks with an ABI that lasts.',
    description:
      'Author EngramTemplates with schema validation, SDK scaffolds, and promotion policies so contributors share AI components through a module registry instead of bespoke pipelines.',
    cta: {
      label: 'Create an Engram',
      to: '/docs/engrams/authoring',
    },
    highlights: [
      'Supports job, deployment, and stateful runtimes',
      'Go SDK is GA; new language SDKs unlock as community contributors land them.',
      'Catalog promotion workflow with semantic version gates, previews, and lint reports',
    ],
  },
  {
    eyebrow: 'State & Telemetry',
    title: 'Instrument every run with metrics, traces, and replay context.',
    description:
      'StoryRuns stream structured logs, metrics, and payload checkpoints so operators treat automation state like a living doc—diffable, replayable, and demo-ready for the broader community.',
    cta: {
      label: 'Inspect Story telemetry',
      to: '/docs/reference/metrics',
    },
    highlights: [
      'Native Prometheus + OpenTelemetry exports',
      'CLI snapshots for cross-environment debugging that stay reviewable in Git',
      'Replay-ready payload history with redaction controls for regulated teams',
    ],
  },
];

export default function ValueProps(): ReactNode {
  return (
    <section className={styles.section}>
      <div className={styles.backdrop} aria-hidden="true" />
      <div className="container">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Why Bubustack</span>
          <h2 className={styles.title}>
            Built for founders shipping fast, trusted by operators keeping score.
          </h2>
          <p className={styles.subtitle}>
            Bubustack blends the clarity of modern automation platforms—modular blocks, instant
            previews, drag-and-drop mental models—with the discipline of infrastructure as code.
            Everything lives in Git, every Engram is reusable, and new connectors land the moment the
            community contributes them.
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
