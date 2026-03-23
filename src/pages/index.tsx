import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';
import Hyperspeed from '@site/src/components/Hyperspeed';
import ValueProps from '@site/src/components/HomepageSections/ValueProps';
import StoryFlow from '@site/src/components/HomepageSections/StoryFlow';
import CommunitySpotlight from '@site/src/components/HomepageSections/CommunitySpotlight';
import EcosystemToggles from '@site/src/components/HomepageSections/EcosystemToggles';
import styles from './index.module.css';
import {useColorMode} from '@docusaurus/theme-common';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  const {colorMode} = useColorMode();
  const isDark = colorMode === 'dark';
  const hyperspeedColors = isDark
    ? {
        roadColor: 0x080808,
        islandColor: 0x0a0a0a,
        background: 0x000000,
        shoulderLines: 0xffffff,
        brokenLines: 0xffffff,
        leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
        rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
        sticks: 0x03b3c3,
      }
    : {
        roadColor: 0xe9e4ff,
        islandColor: 0xf4f1ff,
        background: 0xfefbff,
        shoulderLines: 0x5d68ff,
        brokenLines: 0x5d68ff,
        leftCars: [0x7c6dff, 0x00bfa5, 0xff8de1],
        rightCars: [0x03a9f4, 0xffc107, 0x9c27b0],
        sticks: 0x5d68ff,
      };
  return (
    <div className={styles.heroWrapper}>
      <header className={clsx('hero hero--primary', styles.heroBanner)}>
        <Hyperspeed
          effectOptions={{
            onSpeedUp: () => { },
            onSlowDown: () => { },
            distortion: 'turbulentDistortion',
            length: 400,
            roadWidth: 10,
            islandWidth: 2,
            lanesPerRoad: 4,
            fov: 90,
            fovSpeedUp: 150,
            speedUp: 2,
            carLightsFade: 0.4,
            totalSideLightSticks: 20,
            lightPairsPerRoadWay: 40,
            shoulderLinesWidthPercentage: 0.05,
            brokenLinesWidthPercentage: 0.1,
            brokenLinesLengthPercentage: 0.5,
            lightStickWidth: [0.12, 0.5],
            lightStickHeight: [1.3, 1.7],
            movingAwaySpeed: [60, 80],
            movingCloserSpeed: [-120, -160],
            carLightsLength: [400 * 0.03, 400 * 0.2],
            carLightsRadius: [0.05, 0.14],
            carWidthPercentage: [0.3, 0.5],
            carShiftX: [-0.8, 0.8],
            carFloorSeparation: [0, 5],
            colors: hyperspeedColors,
          }}
        />
        <div className={clsx('container', styles.heroContent)}>
          <Heading as="h1" className={clsx('hero__title', styles.heroTitle)}>
            The GitOps-Native AI Orchestration Platform
          </Heading>
          <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
            Bubustack brings infrastructure-as-code discipline to complex AI
            workflows. Define, deploy, and operate reliable agents with the power
            of Kubernetes and a declarative, community-driven ecosystem.
          </p>
          <div className={styles.heroButtons}>
            <Link
              className={clsx('button button--lg', styles.ctaButton)}
              to="/docs/operator/quickstart">
              Get Started
            </Link>
            <Link
              className={clsx('button button--lg', styles.secondaryButton)}
              to="/docs/community/get-involved">
              Join the Community
            </Link>
          </div>
        </div>
      </header>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="container text--center margin-vert--lg">
      <p style={{marginBottom: '2rem', color: 'var(--ifm-color-emphasis-600)'}}>
        TRUSTED BY TEAMS AT THE FOREFRONT OF AI INNOVATION
      </p>
      <div className={styles.socialProofLogos}>
        <span className={styles.logoPlaceholder}>Datadog</span>
        <span className={styles.logoPlaceholder}>Shopify</span>
        <span className={styles.logoPlaceholder}>Spotify</span>
        <span className={styles.logoPlaceholder}>Uber</span>
        <span className={styles.logoPlaceholder}>Slack</span>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="The GitOps-Native AI Orchestration Platform"
      description="The GitOps-Native AI Orchestration Platform for Production-Ready AI Workflows on Kubernetes">
      <HomepageHeader />
      <main>
        <SocialProof />
        <HomepageFeatures />
        <ValueProps />
        <StoryFlow />
        <EcosystemToggles />
        <CommunitySpotlight />
        <section className="container margin-vert--xl">
          <div className="text--center">
            <Heading as="h2">Launch production AI flows without trading speed for control</Heading>
            <p>
              Install Bobrapet, pull EngramTemplates from the catalog, and wire Stories with
              CEL-powered primitives so every change feels like a visual builder preview and every run
              lands like an infrastructure-as-code apply—reviewed, observable, and Kubernetes-native.
              Need a connector or transport we don’t have yet? Add it with the community and promote it
              through the same Git workflows.
            </p>
            <div className={styles.heroButtons}>
              <Link
                className={clsx('button button--lg', styles.ctaButton)}
                to="/docs/operator/quickstart">
                Read the Quickstart
              </Link>
              <Link
                className={clsx('button button--lg', styles.secondaryButton)}
                to="/docs/community/get-involved">
                Join the Community
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
