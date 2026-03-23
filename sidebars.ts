import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    {
      type: 'category',
      label: 'Ecosystem',
      collapsed: false,
      items: ['overview', 'ecosystem/architecture', 'ecosystem/storage-architecture', 'ecosystem/alternatives'],
    },
    {
      type: 'category',
      label: 'Platform Overview',
      items: [
        'overview/architecture',
        'overview/core',
        'overview/component-ecosystem',
        'overview/durable-semantics',
      ],
    },
    {
      type: 'category',
      label: 'Operator',
      items: [
        'operator/quickstart',
        'operator/day-two-operations',
        'operator/configuration',
        'operator/security',
        'operator/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/rag',
        'guides/automation',
        'guides/inference',
        'guides/agents',
      ],
    },
    {
      type: 'category',
      label: 'How-To',
      items: [
        'howto/enable-transport-tls',
        'howto/handle-large-payloads',
        'howto/tune-backpressure',
      ],
    },
    {
      type: 'category',
      label: 'Engrams',
      items: ['engrams/overview', 'engrams/authoring'],
    },
    {
      type: 'category',
      label: 'Stories',
      items: [
        'stories/overview',
        'stories/syntax',
        'stories/patterns',
        'stories/impulses',
        'stories/primitives',
      ],
    },
    {
      type: 'category',
      label: 'Transports',
      items: [
        'transports/overview',
        'transports/bobravoz',
        'transports/bobravoz-deployment',
        'transports/bobravoz-autoscaling',
        'transports/bobravoz-metrics',
        'transports/bobravoz-reference',
        'transports/bobravoz-troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'SDK',
      items: [
        'sdk/go-sdk',
        'sdk/first-workflow',
        'sdk/sdk-storage-offloading',
        'sdk/sdk-streaming-observability',
        'sdk/sdk-audit-recommendations',
        'sdk/sdk-user-guide',
        'sdk/sdk-integration-guide',
        'sdk/sdk-troubleshooting',
        'sdk/sdk-api-surface',
      ],
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
      items: ['streaming/streaming-contract', 'streaming/transport-settings'],
    },
    {
      type: 'category',
      label: 'API',
      items: ['api/crd-design', 'api/scoping', 'api/versioning', 'api/errors', 'api/migration'],
    },
    {
      type: 'category',
      label: 'Reference',
      items: [
        'reference/api-reference',
        'reference/reference-crds',
        'reference/reference-config',
        'reference/reference-metrics',
        'reference/webhooks',
        'reference/errors',
        'reference/grpc',
        'reference/threat-model',
      ],
    },
    {
      type: 'category',
      label: 'Observability',
      items: ['observability/overview'],
    },
    {
      type: 'category',
      label: 'Contracts',
      items: ['contracts/overview'],
    },
    {
      type: 'category',
      label: 'Community',
      items: [
        'community/get-involved',
        'community/contributing',
        'community/roadmap',
        'community/support',
        'community/changelog',
      ],
    },
    'style-guide',
  ],
};

export default sidebars;
