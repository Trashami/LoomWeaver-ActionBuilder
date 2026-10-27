import pages from './landing-seo-pages.json';

export interface SeoLandingPageConfig {
  readonly slug: string;
  readonly path: string;
  readonly navLabel: string;
  readonly title: string;
  readonly description: string;
  readonly canonical: string;
  readonly eyebrow: string;
  readonly h1Line1: string;
  readonly h1Highlight: string;
  readonly leadHtml: string;
  readonly spotlightTitle: string;
  readonly spotlightSubtitle: string;
  readonly spotlightDescription: string;
  readonly screenshot: string;
  readonly screenshotAlt: string;
  readonly availableToday: readonly string[];
  readonly plannedNext: readonly string[];
  readonly studioRoute: string;
  readonly primaryCtaLabel: string;
  readonly subdomainUrl?: string;
  readonly subdomainLabel?: string;
}

export const SEO_LANDING_PAGES: Readonly<Record<string, SeoLandingPageConfig>> = pages;
