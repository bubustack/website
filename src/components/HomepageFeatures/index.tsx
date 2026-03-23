import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
  icon: ReactNode;
  proofPoints: string[];
};

const FeatureList: FeatureItem[] = [
  {
    title: 'GitOps-Native Control Plane',
    icon: (
      <svg viewBox="0 0 80 80" className={styles.featureIllustration} role="img">
        <defs>
          <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71FEC1" />
            <stop offset="60%" stopColor="#5D68FF" />
            <stop offset="100%" stopColor="#D857FF" />
          </linearGradient>
        </defs>
        <rect x="8" y="8" width="64" height="64" rx="18" fill="url(#gradient1)" opacity="0.85" />
        <path
          d="M40 22L56 46H24L40 22ZM40 30L30.4 44H49.6L40 30ZM29 50H51V58H29V50Z"
          fill="#0A041A"
        />
      </svg>
    ),
    description: (
      <>
        Deploy the Bobrapet operator once and reconcile Stories, Engrams, and Impulses
        straight from Git. Platform teams stay in control while product squads ship on
        top of familiar Kubernetes workflows.
      </>
    ),
    proofPoints: [
      '3s median reconcile across 1.2k Stories in preview clusters keeps founders shipping fast.',
      'Reuse existing RBAC, quota, and admission policies—nothing lives outside Git.',
      'Roadmap: multi-cluster federation with topology-aware failover you can follow in GitOps PRs.',
    ],
  },
  {
    title: 'Reusable Engram Catalog',
    icon: (
      <svg viewBox="0 0 80 80" className={styles.featureIllustration} role="img">
        <defs>
          <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#5D68FF" />
            <stop offset="100%" stopColor="#71FEC1" />
          </linearGradient>
        </defs>
        <circle cx="40" cy="40" r="30" fill="rgba(113, 254, 193, 0.18)" />
        <g stroke="url(#gradient2)" strokeWidth="6" strokeLinecap="round">
          <path d="M40 20V60" />
          <path d="M22 30L58 30" />
          <path d="M26 50H54" />
        </g>
        <circle cx="28" cy="30" r="6" fill="#71FEC1" />
        <circle cx="52" cy="30" r="6" fill="#5D68FF" />
        <circle cx="40" cy="52" r="6" fill="#D857FF" />
      </svg>
    ),
    description: (
      <>
        Package AI and data capabilities as EngramTemplates with a stable ABI so
        contributors, partners, and internal teams co-author the same catalog without
        code forks or lock-in.
      </>
    ),
    proofPoints: [
      'Go SDK is production-ready; additional language SDKs open when community demand and contributions land.',
      'Preview catalog ships with 40+ EngramTemplates covering RAG, guardrails, and evaluation rigs.',
      'Versioned promotion workflow keeps staging → prod parity with GitOps diffs instead of proprietary exports.',
    ],
  },
  {
    title: 'Transport Optionality',
    icon: (
      <svg viewBox="0 0 80 80" className={styles.featureIllustration} role="img">
        <defs>
          <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D857FF" />
            <stop offset="100%" stopColor="#71FEC1" />
          </linearGradient>
        </defs>
        <rect x="14" y="18" width="52" height="16" rx="8" fill="rgba(93, 104, 255, 0.25)" />
        <rect x="14" y="38" width="52" height="10" rx="5" fill="rgba(93, 104, 255, 0.18)" />
        <path
          d="M20 52C28 44 34 60 42 52C50 44 56 56 62 50"
          stroke="url(#gradient3)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <circle cx="24" cy="52" r="5" fill="#D857FF" />
        <circle cx="42" cy="50" r="5" fill="#71FEC1" />
        <circle cx="60" cy="49" r="5" fill="#5D68FF" />
      </svg>
    ),
    description: (
      <>
        Route Story data over Bobravoz gRPC now and extend transports through the same
        declarative spec whenever the community contributes new adapters—no Story rewrites,
        just opt-in manifests.
      </>
    ),
    proofPoints: [
      'Bobravoz sustains 25k StepRun messages/min with end-to-end tracing in community benchmarks.',
      'Declarative overrides let you mix transports per Story without touching Engram code.',
      'Backlog for new transports stays community-driven; contributions land via open pull requests.',
    ],
  },
];

function Feature({title, icon, description, proofPoints}: FeatureItem) {
  return (
    <div className={clsx('col col--4', styles.featureColumn)}>
      <div className={styles.featureCard}>
        <div className={styles.featureIcon}>
          {icon}
        </div>
        <div className={styles.featureBody}>
          <Heading as="h3" className={styles.featureTitle}>
            {title}
          </Heading>
          <p className={styles.featureCopy}>{description}</p>
          <ul className={styles.featureProofList}>
            {proofPoints.map(point => (
              <li key={point} className={styles.featureProofItem}>
                {point}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
