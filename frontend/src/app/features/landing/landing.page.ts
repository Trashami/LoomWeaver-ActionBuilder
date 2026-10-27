import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  resolveDefaultStudioRouteForHost,
} from '../../core/services/cookie-sso.helper';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import { LwSectionImageComponent } from '../../shared/ui/section-image/section-image.component';
import { LwAppHeaderBarComponent } from '../../shared/ui/app-header-bar/app-header-bar.component';
import { LwIconComponent } from '../../shared/ui/public-api';
import {
  LANDING_ASSET_PATHS,
  LANDING_FAQS,
  LANDING_PRICING_PLANS,
  LANDING_PRIMARY_PILLARS,
  LANDING_SESSION_INTEL_ITEMS,
  LANDING_STUDIO_ENGINES,
} from './landing.data';
import { SEO_LANDING_PAGES, SeoLandingPageConfig } from './landing-seo-pages.data';

@Component({
  selector: 'lw-landing-page',
  standalone: true,
  imports: [RouterLink, NgpButton, LwIconComponent, LwAppHeaderBarComponent, LwSectionImageComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit {
  readonly auth = inject(AuthSessionService);
  readonly store = inject(LoomWeaverStoreService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly generativeAiEnabled = input<boolean>(false);
  readonly isWeaveEnabled = computed(
    () => this.generativeAiEnabled() || this.store.weaveEnabled(),
  );

  readonly assets = LANDING_ASSET_PATHS;
  readonly mobileMenuOpen = signal<boolean>(false);
  readonly billingAnnual = signal<boolean>(false);
  readonly activeIntelId = signal<string>('cult-presence');
  readonly activeExperienceMode = signal<'memory' | 'vtt' | 'guides' | 'dice'>('vtt');
  readonly openFaqId = signal<string>('faq-what-is-loomweaver-vtt');
  readonly activeSeoPageSlug = signal<string>('home');

  readonly seoPageTabs: readonly SeoLandingPageConfig[] = [
    SEO_LANDING_PAGES['home'],
    SEO_LANDING_PAGES['vtt'],
    SEO_LANDING_PAGES['campaign-manager'],
    SEO_LANDING_PAGES['battlemap-builder'],
    SEO_LANDING_PAGES['effect-builder'],
    SEO_LANDING_PAGES['encounter-builder'],
    SEO_LANDING_PAGES['3d-assets'],
    SEO_LANDING_PAGES['ai-campaign-assistant'],
    SEO_LANDING_PAGES['features'],
  ];

  readonly activeSeoPage = computed<SeoLandingPageConfig>(
    () => SEO_LANDING_PAGES[this.activeSeoPageSlug()] ?? SEO_LANDING_PAGES['home'],
  );

  readonly scrollY = signal<number>(0);
  readonly parallaxEnabled = signal<boolean>(true);
  readonly headerScrolled = computed(() => this.scrollY() > 16);

  readonly heroSceneryTransform = computed(() => {
    if (!this.parallaxEnabled()) return 'translate3d(0, 0, 0)';
    const offset = Math.min(this.scrollY() * 0.08, 42);
    return `translate3d(0, ${offset.toFixed(1)}px, 0)`;
  });

  readonly heroRavenTransform = computed(() => {
    if (!this.parallaxEnabled()) return 'translate3d(0, 0, 0)';
    const yOffset = Math.min(this.scrollY() * -0.06, 0);
    const xOffset = Math.min(this.scrollY() * 0.03, 18);
    return `translate3d(${xOffset.toFixed(1)}px, ${yOffset.toFixed(1)}px, 0)`;
  });

  readonly primaryPillars = computed(() => {
    const weaveOn = this.isWeaveEnabled();
    if (weaveOn) return LANDING_PRIMARY_PILLARS;
    return LANDING_PRIMARY_PILLARS.map((p) =>
      p.id === 'weave'
        ? {
            ...p,
            id: 'world-lore',
            title: 'World & Lore Atlas',
            flag: undefined,
            description:
              'Connect NPCs, factions, lore, quests, and regional locations into one living campaign atlas with strict GM and player visibility controls.',
            bullets: [
              '100% GM-authored canon and worldbuilding hierarchy',
              'Connected faction histories, regional maps, and lore entries',
              'Role-isolated secrets that never leak to players prematurely',
            ],
            route: '/world-lore',
          }
        : p,
    );
  });

  readonly studioEngines = computed(() => {
    const weaveOn = this.isWeaveEnabled();
    if (weaveOn) return LANDING_STUDIO_ENGINES;
    return LANDING_STUDIO_ENGINES.map((e) =>
      e.id === 'engine-weave'
        ? {
            ...e,
            title: 'The Loom Memory & World Lore Graph',
            metrics: ['Per-Player Isolation', '100% Canonical Recall', 'Deep-Linked Dossiers'],
          }
        : e,
    );
  });

  readonly sessionIntelItems = LANDING_SESSION_INTEL_ITEMS;

  readonly pricingPlans = computed(() => {
    const weaveOn = this.isWeaveEnabled();
    if (weaveOn) return LANDING_PRICING_PLANS;
    return LANDING_PRICING_PLANS.map((plan) => ({
      ...plan,
      features: plan.features.map((f) =>
        f
          .replace('The Weave optional AI companion (100% GM authorship)', 'Connected World & Lore Atlas + Faction Graph')
          .replace('Priority Weave synthesis & multi-campaign universe linking', 'Multi-campaign universe linking & lore indexing'),
      ),
    }));
  });

  readonly faqs = computed(() => {
    const weaveOn = this.isWeaveEnabled();
    if (weaveOn) return LANDING_FAQS;
    return LANDING_FAQS.map((faq) =>
      faq.id === 'faq-gm-authorship'
        ? {
            ...faq,
            answer:
              faq.answer,
          }
        : faq,
    );
  });

  readonly currentIntel = computed(
    () =>
      this.sessionIntelItems.find((item) => item.id === this.activeIntelId()) ??
      this.sessionIntelItems[0],
  );

  ngOnInit(): void {
    this.initScrollAndParallaxListener();

    const sub = this.route.url.subscribe(() => {
      this.syncRouteAndSeoState();
    });
    this.destroyRef.onDestroy(() => sub.unsubscribe());
    this.syncRouteAndSeoState();
  }

  private syncRouteAndSeoState(): void {
    const currentPath = this.router.url.split('?')[0].replace(/\/+$/, '') || '/';
    const queryAuth = this.route.snapshot.queryParamMap.get('auth');
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || resolveDefaultStudioRouteForHost();

    if (currentPath === '/login' || queryAuth === 'login') {
      this.auth.openAuthModal('login', returnUrl);
    } else if (currentPath === '/register' || queryAuth === 'register') {
      this.auth.openAuthModal('register', returnUrl);
    }

    const routeDataSeo = this.route.snapshot.data['seoPage'] as string | undefined;
    const legacySlug = this.route.snapshot.paramMap.get('slug');
    const resolvedKey = this.resolveSeoKey(routeDataSeo, legacySlug, currentPath);
    this.activeSeoPageSlug.set(resolvedKey);

    const cfg = SEO_LANDING_PAGES[resolvedKey] ?? SEO_LANDING_PAGES['home'];
    this.titleSvc.setTitle(cfg.title);
    this.metaSvc.updateTag({ name: 'description', content: cfg.description });
    this.metaSvc.updateTag({ property: 'og:title', content: cfg.title });
    this.metaSvc.updateTag({ property: 'og:description', content: cfg.description });
    this.metaSvc.updateTag({ property: 'og:url', content: cfg.canonical });
    this.metaSvc.updateTag({ name: 'twitter:title', content: cfg.title });
    this.metaSvc.updateTag({ name: 'twitter:description', content: cfg.description });
    this.updateCanonicalLink(cfg.canonical);
    this.metaSvc.updateTag({ name: 'robots', content: ['login', 'register'].includes(resolvedKey) ? 'noindex, follow' : 'index, follow, max-image-preview:large' });
  }

  private resolveSeoKey(
    routeDataSeo: string | undefined,
    legacySlug: string | null,
    currentPath: string,
  ): string {
    try {
      const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      if (!currentPath || currentPath === '/' || currentPath === '/welcome') {
        if (host.startsWith('maps.')) return 'battlemap-builder';
        if (host.startsWith('vtt.') || host.startsWith('vtt3d.')) return 'vtt';
        if (host.startsWith('effectbuilder.')) return 'effect-builder';
        if (host.startsWith('actionbuilder.')) return 'encounter-builder';
        if (host.startsWith('3dassets.') || host.startsWith('generator.')) return '3d-assets';
      }
    } catch {}
    if (['/login', '/register', '/about'].includes(currentPath)) return currentPath.slice(1);
    if (routeDataSeo && SEO_LANDING_PAGES[routeDataSeo]) {
      return routeDataSeo;
    }
    const cleanPath = currentPath.replace(/^\/+/, '');
    if (SEO_LANDING_PAGES[cleanPath]) {
      return cleanPath;
    }
    const slugMap: Record<string, string> = {
      'virtual-tabletop': 'vtt',
      'campaign-memory': 'ai-campaign-assistant',
      'worldbuilding-ai': 'campaign-manager',
      'world-atlas-quests': 'battlemap-builder',
      'creator-marketplace': 'features',
    };
    if (legacySlug && slugMap[legacySlug]) {
      return slugMap[legacySlug];
    }
    return 'home';
  }

  private updateCanonicalLink(url: string): void {
    try {
      let link = this.doc.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = this.doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        this.doc.head.appendChild(link);
      }
      link.setAttribute('href', url);
    } catch {}
  }

  private initScrollAndParallaxListener(): void {
    if (typeof window === 'undefined') return;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.parallaxEnabled.set(!reducedMotion && window.innerWidth >= 960);

    let ticking = false;
    const onScroll = (): void => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.scrollY.set(window.scrollY || 0);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => window.removeEventListener('scroll', onScroll));
  }

  openAuth(mode: 'login' | 'register', targetRoute?: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.mobileMenuOpen.set(false);
    const dest = targetRoute || resolveDefaultStudioRouteForHost();
    if (this.auth.isAuthenticated()) {
      void this.router.navigateByUrl(dest);
      return;
    }
    this.auth.openAuthModal(mode, dest);
  }

  enterStudioOrSignIn(targetRoute?: string): void {
    this.openAuth('login', targetRoute);
  }

  setBilling(annual: boolean): void {
    this.billingAnnual.set(annual);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  scrollToSection(sectionId: string, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    this.mobileMenuOpen.set(false);
    if (typeof document !== 'undefined') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  toggleFaq(id: string): void {
    this.openFaqId.update((curr) => (curr === id ? '' : id));
  }
}
