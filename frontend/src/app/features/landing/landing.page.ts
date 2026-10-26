import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthSessionService } from '../../core/services/auth-session.service';
import {
  isSubdomainHost,
  resolveDefaultStudioRouteForHost,
} from '../../core/services/cookie-sso.helper';
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
  imports: [RouterLink, LwIconComponent],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingPageComponent implements OnInit {
  readonly auth = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly titleSvc = inject(Title);
  private readonly metaSvc = inject(Meta);
  private readonly doc = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

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

  readonly primaryPillars = LANDING_PRIMARY_PILLARS;
  readonly studioEngines = LANDING_STUDIO_ENGINES;
  readonly sessionIntelItems = LANDING_SESSION_INTEL_ITEMS;
  readonly pricingPlans = LANDING_PRICING_PLANS;
  readonly faqs = LANDING_FAQS;

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
    const currentPath = this.router.url.split('?')[0];
    const queryAuth = this.route.snapshot.queryParamMap.get('auth');
    const returnUrl =
      this.route.snapshot.queryParamMap.get('returnUrl') || resolveDefaultStudioRouteForHost();

    if (isSubdomainHost()) {
      if (this.auth.isAuthenticated()) {
        void this.router.navigateByUrl(resolveDefaultStudioRouteForHost());
        return;
      }
      this.auth.openAuthModal('login', resolveDefaultStudioRouteForHost());
    } else if (currentPath === '/login' || queryAuth === 'login') {
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
  }

  private resolveSeoKey(
    routeDataSeo: string | undefined,
    legacySlug: string | null,
    currentPath: string,
  ): string {
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
