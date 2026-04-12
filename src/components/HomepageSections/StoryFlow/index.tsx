import type {ReactNode} from 'react';
import Heading from '@theme/Heading';
import Mermaid from '@theme/Mermaid';
import styles from './styles.module.css';

type FlowStep = {
  badge: string;
  title: string;
  description: string;
  details: string[];
};

type PersonaCallout = {
  persona: string;
  summary: string;
  highlights: string[];
};

const diagram = `
flowchart LR
  commit[Git Commit]
  review[Pull Request Review]
  gitops[GitOps Controller]
  api[(Kubernetes API)]
  bobrapet[Bobrapet Operator]
  engrams[Engram Runtimes]
  transport{Bobravoz gRPC}
  storyrun[(StoryRun Telemetry)]
  observability[(Prometheus / OTEL)]

  commit --> review --> gitops --> api --> bobrapet
  bobrapet -->|hydrates| engrams
  bobrapet --> transport --> storyrun
  engrams --> storyrun
  storyrun --> observability
`;

const flow: FlowStep[] = [
  {
    badge: '01',
    title: 'Commit the Story',
    description:
      'Write Story, Engram, and Impulse manifests alongside your application code. Push to Git.',
    details: [
      'Code review catches issues before anything runs.',
      'Git history tracks every change to your workflows.',
    ],
  },
  {
    badge: '02',
    title: 'Reconcile with Bobrapet',
    description:
      'Your GitOps controller applies the manifests. Bobrapet creates runtimes, wires transports, and schedules steps.',
    details: [
      'Bobravoz gRPC handles streaming transport with per-step tracing.',
      'Admission webhooks validate resources before creation.',
    ],
  },
  {
    badge: '03',
    title: 'Measure StoryRuns',
    description:
      'StoryRuns emit traces, structured errors, and payload references to your observability stack.',
    details: [
      'OpenTelemetry traces across the full workflow lifecycle.',
      'Replay or debug failed runs from stored outputs.',
    ],
  },
];

const personas: PersonaCallout[] = [
  {
    persona: 'Developers',
    summary:
      'Build Engrams with the Go SDK. Test locally with the testkit. Push to Git and let the operator handle the rest.',
    highlights: [
      'Type-safe configuration and input binding',
      'Local testing without a Kubernetes cluster',
      'Structured errors with retry classification',
    ],
  },
  {
    persona: 'Platform Engineers',
    summary:
      'Deploy the operator, tune the ConfigMap, set up observability. Standard Kubernetes operations.',
    highlights: [
      'ConfigMap-based tuning for scheduling, retries, and resources',
      'OpenTelemetry integration for traces and metrics',
      'Managed runner RBAC and guarded cross-namespace policies',
    ],
  },
];

export default function StoryFlow(): ReactNode {
  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.wrapper}>
          <header className={styles.header}>
            <span className={styles.eyebrow}>How it works</span>
            <h2 className={styles.title}>
              From Git commit to running workflow.
            </h2>
            <p className={styles.subtitle}>
              BubuStack follows a simple path: declare resources in Git, let the operator reconcile, observe the results.
            </p>
          </header>
          <div className={styles.diagramPanel}>
            <Mermaid value={diagram} />
          </div>
          <div className={styles.personaGrid}>
            {personas.map(persona => (
              <article key={persona.persona} className={styles.personaCard}>
                <Heading as="h3" className={styles.personaTitle}>
                  {persona.persona}
                </Heading>
                <p className={styles.personaSummary}>{persona.summary}</p>
                <ul className={styles.personaHighlights}>
                  {persona.highlights.map(highlight => (
                    <li key={highlight} className={styles.personaHighlight}>
                      {highlight}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className={styles.flowGrid}>
            {flow.map(step => (
              <article key={step.title} className={styles.flowCard}>
                <span className={styles.badge}>{step.badge}</span>
                <div className={styles.flowBody}>
                  <h3 className={styles.flowTitle}>{step.title}</h3>
                  <p className={styles.flowDescription}>{step.description}</p>
                  <ul className={styles.detailList}>
                    {step.details.map(item => (
                      <li key={item} className={styles.detailItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
