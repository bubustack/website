import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Bubustack | Cloud-Native AI Orchestration',
  tagline: 'The open-source toolkit for building, deploying, and scaling production-grade AI workflows on Kubernetes.',
  favicon: 'img/favicon.svg',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://bubustack.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'bubustack',
  projectName: 'bobrapet',

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: undefined,
        },
        // Blog routes are disabled temporarily while we refresh long-form content.
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/bubustack.png',
    colorMode: {
      defaultMode: 'dark',
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Bubustack',
      logo: {
        alt: 'Bubustack Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
        {
          to: '/features',
          label: 'Features',
          position: 'left',
        },
        {
          to: '/use-cases',
          label: 'Use Cases',
          position: 'left',
        },
        {
          to: '/docs/community/get-involved',
          label: 'Community',
          position: 'left',
        },
        {
          href: 'https://github.com/bubustack',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {label: 'Overview', to: '/docs/overview'},
            {label: 'Architecture', to: '/docs/ecosystem/architecture'},
          ],
        },
        {
          title: 'Operator & SDK',
          items: [
            {label: 'Bobrapet Quickstart', to: '/docs/operator/quickstart'},
            {label: 'Day-2 Operations', to: '/docs/operator/day-two-operations'},
            {label: 'Go SDK', to: '/docs/sdk/go-sdk'},
            {label: 'API Reference', to: '/docs/reference/api-reference'},
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/bubustack',
            },
            {
              label: 'X (Twitter)',
              href: 'https://x.com/bubustack',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Bubustack. Built for operators.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,

  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
};

export default config;
