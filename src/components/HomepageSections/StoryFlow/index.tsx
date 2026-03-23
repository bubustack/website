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
      'Author Story, EngramTemplate, and Impulse manifests alongside application code so the narrative lives in Git. CEL guards and schemas provide intent before anything runs.',
    details: [
      'Code review enforces collaboration between builders and operators.',
      'Git history captures template upgrades, environment promotion, and links to community requests.',
    ],
  },
  {
    badge: '02',
    title: 'Reconcile with Bobrapet',
    description:
      'GitOps controllers apply manifests; the Bobrapet operator synthesises runtimes, attaches Engrams, and wires transports.',
    details: [
      'Bobravoz carries traffic today with latency histograms emitted per StepRun.',
      'The same declarative spec powers future adapters when the community contributes them.',
      'Policy diffing replaces drag-and-drop wizards so compliance stays visible.',
    ],
  },
  {
    badge: '03',
    title: 'Measure StoryRuns',
    description:
      'StoryRuns stream metrics, traces, and payload checkpoints to your observability stack for instant retrospection.',
    details: [
      'Dashboards chart median run latency, tail retries, and Engram saturation.',
      'Replay runs or promote versions downstream with GitOps diffs.',
    ],
  },
];

const personas: PersonaCallout[] = [
  {
    persona: 'Founders & Product',
    summary:
      'Prove value fast with reusable Engrams and Story templates that map directly to user journeys.',
    highlights: [
      'Launch new Stories in hours, not sprints, by cloning EngramTemplates for RAG, agents, and governance.',
      'Community boards tie Git commits to catalog releases and shared priorities.',
      'StoryRun telemetry surfaces activation, retention, and cost-per-run insights you can show investors.',
    ],
  },
  {
    persona: 'Operators & SREs',
    summary:
      'Keep the mesh reliable with Kubernetes-native guardrails, transport choice, and full-fidelity telemetry.',
    highlights: [
      'GitOps reconcile proves drift-free environments with <3s median apply time.',
      'Sustain 25k StepRun messages/min on Bobravoz with end-to-end tracing and SLOs.',
      'Coordinate new transport work through open discussions and shared backlogs.',
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
              Git commit to StoryRun telemetry in one declarative motion.
            </h2>
            <p className={styles.subtitle}>
              Bubustack visualises the full lifecycle so founders, operators, and contributors know
              exactly where value lands—and how community contributions unlock the next transport or SDK.
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
