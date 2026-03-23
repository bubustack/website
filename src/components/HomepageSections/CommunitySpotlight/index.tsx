import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import styles from './styles.module.css';

type Highlight = {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
  cta: {
    label: string;
    to: string;
    external?: boolean;
  };
};

const highlights: Highlight[] = [
  {
    eyebrow: 'Working Groups',
    title: 'Operators, Engram authors, and transport leads ship together.',
    description:
      'Join weekly syncs to shape Bobrapet upgrades, EngramTemplate standards, and the shared backlog that lives in Git, not slides.',
    items: [
      'Operator guild publishes GitOps runbooks and drift dashboards.',
      'Engram working group curates catalog reviews every Thursday.',
      'Transport council tracks Bobravoz releases and prioritizes new adapters based on demand.',
    ],
    cta: {
      label: 'View session calendar',
      to: '/docs/community/get-involved#working-groups',
    },
  },
  {
    eyebrow: 'Discussion Board',
    title: 'Ship faster with peers in GitHub Discussions.',
    description:
      'Trade Story patterns, telemetry dashboards, and Engram ideas with contributors who build in production and share manifests over screenshots.',
    items: [
      'Solution blueprints tagged by Story objective and compliant transports.',
      'Troubleshooting threads with manifests, CLI snippets, and observability tips.',
      'Showcase channel for catalog launches and partner integrations.',
    ],
    cta: {
      label: 'Open discussions',
      to: 'https://github.com/bubustack/bobrapet/discussions',
      external: true,
    },
  },
  {
    eyebrow: 'Roadmap Snapshots',
    title: 'Community backlog, updated in the open.',
    description:
      'Track feature delivery straight from Git history: Bobravoz upgrades, Engram templates, and SDK enhancements that ship in response to community contributions.',
    items: [
      'Sprint burndown with StoryRun metrics and Engram adoption stats.',
      'Public board showing requested SDKs and transports without fixed timelines.',
      'Open RFCs for catalog governance and compliance automation.',
    ],
    cta: {
      label: 'Review community board',
      to: '/docs/community/get-involved',
    },
  },
];

export default function CommunitySpotlight(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>Community Momentum</span>
            <h2 className={styles.title}>
              Ship with a community that treats automation as a shared craft.
            </h2>
            <p className={styles.subtitle}>
              Working groups, discussions, and backlog snapshots keep founders, operators, and
              contributors aligned on what ships next.
            </p>
          </header>
          <div className={styles.grid}>
            {highlights.map(highlight => (
              <article key={highlight.title} className={styles.card}>
                <span className={styles.cardEyebrow}>{highlight.eyebrow}</span>
                <h3 className={styles.cardTitle}>{highlight.title}</h3>
                <p className={styles.cardDescription}>{highlight.description}</p>
                <ul className={styles.itemList}>
                  {highlight.items.map(item => (
                    <li key={item} className={styles.item}>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  className={clsx('button button--sm', styles.cta)}
                  to={highlight.to}
                  {...(highlight.external
                    ? {target: '_blank', rel: 'noreferrer'}
                    : undefined)}>
                  {highlight.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
