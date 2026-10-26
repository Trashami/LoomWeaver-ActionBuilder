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
  private readonly destroyRef = inject(DestroyRef);

  readonly assets = LANDING_ASSET_PATHS;
  readonly mobileMenuOpen = signal<boolean>(false);
  readonly billingAnnual = signal<boolean>(false);
  readonly activeIntelId = signal<string>('cult-presence');
  readonly activeExperienceMode = signal<'memory' | 'vtt' | 'guides' | 'dice'>('vtt');
  readonly openFaqId = signal<string>('faq-what-is-loomweaver-vtt');

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
    this.titleSvc.setTitle(
      'LoomWeaver (Loom-Weaver) — 2.5D Virtual Tabletop (VTT), Living Campaign Memory & TTRPG Studio',
    );
    this.metaSvc.updateTag({
      name: 'description',
      content:
        'LoomWeaver (loom-weaver.com) is the unified 2.5D Virtual Tabletop (VTT) and TTRPG campaign manager for D&D 5e and custom worlds. Free living campaign memory (The Loom), optional GM-authored worldbuilding (The Weave), LoomMaps cartography, and 100% free player seats.',
    });

    this.initScrollAndParallaxListener();

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

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.applyFeatureSeo(slug);
    }
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

  openAuth(mode: 'login' | 'register', targetRoute?: string): void {
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

  private applyFeatureSeo(slug: string): void {
    const seoMap: Record<string, { title: string; desc: string }> = {
      'campaign-memory': {
        title: 'The Loom — Free TTRPG Campaign Memory & Lore Search | LoomWeaver VTT',
        desc: 'Search your D&D 5e campaign notes, session recaps, and NPC dossiers in natural language with zero hallucination and per-player secret isolation on LoomWeaver.',
      },
      'worldbuilding-ai': {
        title: 'The Weave — GM-Authored Worldbuilding & Lore Graph | LoomWeaver',
        desc: 'Draft context-aware NPCs, monsters, quests, and battlemaps grounded in your Neo4j campaign graph with 100% Game Master review control.',
      },
      'virtual-tabletop': {
        title: 'LoomWeaver VTT — 2.5D Virtual Tabletop, Lighting, Action Economy & 3D Dice',
        desc: 'Run tactical tabletop RPG combat on the LoomWeaver 2.5D Virtual Tabletop (VTT) with gradual lighting, line-of-sight fog of war, 3D physics dice, and automated XP.',
      },
      'world-atlas-quests': {
        title: 'LoomMaps — VTT Battlemap Maker, Cutaway Walls & World Atlas | LoomWeaver',
        desc: 'Build interactive regional maps and multi-layer tactical VTT battlemaps with cutaway walls, spline ribbons, party travel markers, and POI secrets.',
      },
      'creator-marketplace': {
        title: 'TTRPG & VTT Creator Marketplace — 85/15 Revenue Split | LoomWeaver',
        desc: 'Publish and monetize custom campaigns, adventure modules, and VTT battlemaps with a creator-first 85/15 revenue split and one-click GM imports.',
      },
    };
    const found = seoMap[slug];
    if (found) {
      this.titleSvc.setTitle(found.title);
      this.metaSvc.updateTag({ name: 'description', content: found.desc });
    }
  }
}
