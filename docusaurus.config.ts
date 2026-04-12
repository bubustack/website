import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'BubuStack | Composable Workflows on Kubernetes',
  tagline: 'Open-source toolkit for declarative, composable workflows on Kubernetes. Do one thing and do it well.',
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
  projectName: 'website',

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
          editUrl: 'https://github.com/bubustack/website/edit/main/',
          exclude: ['plans/**', 'deep-research/**'],
        },
        // Blog routes are disabled temporarily while we refresh long-form content.
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins: [
    [
      require.resolve('@easyops-cn/docusaurus-search-local'),
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
        language: ['en'],
      },
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
      title: 'BubuStack',
      logo: {
        alt: 'BubuStack Logo',
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
          to: '/docs/community/get-involved',
          label: 'Community',
          position: 'left',
        },
        {
          href: 'https://github.com/bubustack/examples',
          label: 'Examples',
          position: 'right',
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
          title: 'Start Here',
          items: [
            {label: 'Quickstart', to: '/docs/getting-started/quickstart'},
            {label: 'Overview', to: '/docs/overview'},
            {label: 'Examples', href: 'https://github.com/bubustack/examples'},
          ],
        },
        {
          title: 'Build & Operate',
          items: [
            {label: 'Operator Config', to: '/docs/operator/configuration'},
            {label: 'Go SDK', to: '/docs/sdk/go-sdk'},
            {label: 'Observability', to: '/docs/observability/overview'},
          ],
        },
        {
          title: 'Trust & Support',
          items: [
            {
              label: 'Security Policy',
              href: 'https://github.com/bubustack/website/blob/main/SECURITY.md',
            },
            {
              label: 'Support',
              href: 'https://github.com/bubustack/website/blob/main/SUPPORT.md',
            },
            {
              label: 'Code of Conduct',
              href: 'https://github.com/bubustack/website/blob/main/CODE_OF_CONDUCT.md',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Get Involved',
              to: '/docs/community/get-involved',
            },
            {
              label: 'Roadmap',
              to: '/docs/community/roadmap',
            },
            {
              label: 'Discord',
              href: 'https://discord.gg/dysrB7D8H6',
            },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} BubuStack. Licensed under Apache 2.0. Built for operators.`,
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
