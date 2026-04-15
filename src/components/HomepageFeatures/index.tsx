import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type ProofPoint = {
  text: string;
  planned?: boolean;
};

type FeatureItem = {
  title: string;
  description: ReactNode;
  icon: ReactNode;
  proofPoints: ProofPoint[];
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
        Deploy the Bobrapet operator and manage Stories, Engrams, and Impulses as
        Kubernetes CRDs. Everything lives in Git — use Flux, Argo CD, or plain kubectl.
      </>
    ),
    proofPoints: [
      {text: 'Standard CRDs with admission webhooks for validation and mutation.'},
      {text: 'Reuse existing RBAC, quotas, and namespace policies — nothing proprietary.'},
      {text: 'Works with any GitOps controller that applies Kubernetes manifests.'},
    ],
  },
  {
    title: 'Reusable Engram & Impulse Catalog',
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
        Engrams process data. Impulses trigger workflows from external events.
        Both are defined as templates with schema validation and shared through Git today.
        `bubu-registry` adds a Git-backed catalog and `bubu` CLI, while richer package
        guarantees remain on the roadmap.
      </>
    ),
    proofPoints: [
      {text: 'Go SDK for building batch, streaming, and trigger (Impulse) components.'},
      {text: 'Growing catalog of Engrams and Impulses — OpenAI, LiveKit, HTTP, and more.'},
      {text: 'Testkit for local testing without a cluster.'},
      {text: 'New SDKs (Python, TypeScript) and storage backends.', planned: true},
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
        Route data over Bobravoz gRPC with hub-and-spoke or peer-to-peer topologies.
        Transport selection is declarative per Story — swap transports without rewriting Engrams.
      </>
    ),
    proofPoints: [
      {text: 'Bobravoz gRPC with backpressure, flow control, and OpenTelemetry tracing.'},
      {text: 'Declarative transport overrides per Story — no Engram code changes needed.'},
      {text: 'Transport spec is open for community-contributed adapters.'},
      {text: 'New transport operators and mixed batch+streaming Stories.', planned: true},
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
              <li key={point.text} className={clsx(styles.featureProofItem, point.planned && styles.featureProofPlanned)}>
                {point.planned ? (
                  <Link to="/docs/community/roadmap" className={styles.plannedLink}>
                    * {point.text}
                  </Link>
                ) : (
                  point.text
                )}
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
