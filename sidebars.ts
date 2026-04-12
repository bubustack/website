import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'overview',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: ['getting-started/prerequisites', 'getting-started/quickstart'],
    },
    {
      type: 'category',
      label: 'Platform Overview',
      items: [
        'overview/architecture',
        'overview/core',
        {
          type: 'link',
          label: 'core (repo)',
          href: 'https://github.com/bubustack/core',
        },
        {
          type: 'link',
          label: 'tractatus (repo)',
          href: 'https://github.com/bubustack/tractatus',
        },
        'overview/component-ecosystem',
        'overview/durable-semantics',
        'overview/alternatives',
      ],
    },
    {
      type: 'category',
      label: 'SDK',
      items: ['sdk/go-sdk', 'sdk/building-engrams'],
    },
    {
      type: 'category',
      label: 'Runtime',
      items: [
        'runtime/lifecycle',
        'runtime/primitives',
        'runtime/expressions',
        'runtime/inputs',
        'runtime/payloads',
        'runtime/caching',
      ],
    },
    {
      type: 'category',
      label: 'Streaming',
      items: ['streaming/streaming-contract', 'streaming/transport-settings', 'streaming/lifecycle-hooks'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/crd-cheatsheet', 'api/crd-design', 'api/story-trigger', 'api/effect-claims', 'api/scoping', 'api/versioning', 'api/errors', 'api/migration'],
    },
    {
      type: 'category',
      label: 'Operator',
      items: [
        'operator/profiles',
        'operator/configuration',
        'operator/runner-rbac',
        'operator/bobravoz-grpc-configuration',
      ],
    },
    {
      type: 'category',
      label: 'Observability',
      items: ['observability/overview', 'observability/runbook'],
    },
    {
      type: 'category',
      label: 'Community',
      items: ['community/get-involved', 'community/roadmap'],
    },
    'style-guide',
  ],
};

export default sidebars;
