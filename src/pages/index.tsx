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
            Build, Deploy, and Scale Production-Grade AI Workflows on Kubernetes.
          </Heading>
          <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
            Bubustack is the open-source, cloud-native toolkit for AI engineers who build and operate complex, mission-critical workflows with confidence.
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

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Cloud-Native AI Orchestration Platform"
      description="Bubustack is the open-source, cloud-native toolkit for AI engineers who build and operate complex, mission-critical workflows with confidence.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        <ValueProps />
        <StoryFlow />
        <EcosystemToggles />
        <CommunitySpotlight />
        <section className="container margin-vert--xl">
          <div className="text--center">
            <Heading as="h2">From Visual Builder to Git-Native Workflow</Heading>
            <p>
            With Bubustack, you can visually design complex AI workflows and then manage them as code.
            Use our pre-built templates and CEL-powered connectors to get started quickly.
            Every change is versioned, reviewed, and deployed through standard Git workflows,
            giving you the speed of a visual builder with the reliability of infrastructure-as-code.
            If you need a new integration, you can easily build one and share it with the community.
            </p>
            <div className={styles.heroButtons}>
              <Link
                className={clsx('button button--lg', styles.ctaButton)}
                to="/docs/operator/quickstart">
                Explore the Docs
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
