import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

const roadmapNow = [
  'No feedback loops / cycles — DAG-only by design.',
  'No durable execution checkpoints or automatic replay on failure.',
  'No mutable shared state between steps.',
  'No mid-execution event injection into running workflows.',
  'No mixed batch+streaming in one Story.',
];

const waysToHelp = [
  'Test the platform on real workloads and open reproducible issues.',
  'Improve docs and examples where onboarding is confusing.',
  'Build and share Engrams and Impulses.',
  'Contribute testkit, transport adapters, and storage backends.',
];

const roadmapNext = [
  'Loop primitive — bounded iteration with exit conditions.',
  'Workflow checkpointing — durable execution and restart recovery.',
  'bubu-registry and bubu CLI for publishing/discovery workflows.',
  'Python SDK with the same ABI contract as the Go SDK.',
  'MCP gateway and native A2A protocol support.',
  'Multi-cluster federation — global workflows across regions.',
  'Compliance primitives — audit trails, cost attribution, EU AI Act traceability.',
];

const links = [
  {label: 'Get Involved', to: '/docs/community/get-involved'},
  {label: 'Roadmap', to: '/docs/community/roadmap'},
  {label: 'GitHub', to: 'https://github.com/bubustack', external: true},
  {label: 'Discord', to: 'https://discord.gg/dysrB7D8H6', external: true},
  {label: 'Examples', to: 'https://github.com/bubustack/examples', external: true},
];

export default function CommunitySpotlight(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>Community</span>
            <h2 className={styles.title}>
              Manifesto lives in Get Involved. This section mirrors the roadmap.
            </h2>
            <p className={styles.subtitle}>
              BubuStack is deployable today. The current limitations and direction are
              tracked in the roadmap, and contribution flow is documented in Get Involved.
            </p>
          </header>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>What is missing today</h3>
              <ul className={styles.itemList}>
                {roadmapNow.map(item => (
                  <li key={item} className={styles.item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>What is next</h3>
              <ul className={styles.itemList}>
                {roadmapNext.map(item => (
                  <li key={item} className={styles.item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>Where we need help</h3>
              <ul className={styles.itemList}>
                {waysToHelp.map(item => (
                  <li key={item} className={styles.item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>

          <div className={styles.ctaRow}>
            <p className={styles.ctaText}>
              The canonical sources are Get Involved and Roadmap. Homepage summary stays in sync with those pages.
            </p>
            <div className={styles.ctaButtons}>
              {links.map(link => (
                <Link
                  key={link.label}
                  className={clsx('button button--sm', styles.cta)}
                  to={link.to}
                  {...(link.external
                    ? {target: '_blank', rel: 'noreferrer'}
                    : undefined)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
