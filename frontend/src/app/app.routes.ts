import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/home.page').then((m) => m.HomePageComponent),
  },
  {
    path: 'campaigns',
    loadComponent: () =>
      import('./features/campaigns/campaigns.page').then((m) => m.CampaignsPageComponent),
  },
  {
    path: 'characters',
    loadComponent: () =>
      import('./features/characters/characters.page').then((m) => m.CharactersPageComponent),
  },
  {
    path: 'maps',
    loadComponent: () =>
      import('./features/maps/maps.page').then((m) => m.MapsPageComponent),
  },
  {
    path: 'arcane-screen',
    loadComponent: () =>
      import('./features/arcane-screen/arcane-screen.page').then(
        (m) => m.ArcaneScreenPageComponent,
      ),
  },
  {
    path: 'encounters',
    loadComponent: () =>
      import('./features/encounters/encounters.page').then((m) => m.EncountersPageComponent),
  },
  {
    path: 'dice',
    loadComponent: () =>
      import('./features/dice/dice.page').then((m) => m.DicePageComponent),
  },
  {
    path: 'effects',
    loadComponent: () =>
      import('./features/effects/effects.page').then((m) => m.EffectsPageComponent),
  },
  {
    path: 'assets',
    loadComponent: () =>
      import('./features/assets/assets.page').then((m) => m.AssetsPageComponent),
  },
  {
    path: 'marketplace',
    loadComponent: () =>
      import('./features/marketplace/marketplace.page').then(
        (m) => m.MarketplacePageComponent,
      ),
  },
  {
    path: 'statistics',
    loadComponent: () =>
      import('./features/statistics/statistics.page').then((m) => m.StatisticsPageComponent),
  },
  {
    path: 'loom',
    loadComponent: () =>
      import('./features/loom/loom.page').then((m) => m.LoomPageComponent),
  },
  {
    path: 'weave',
    loadComponent: () =>
      import('./features/weave/weave.page').then((m) => m.WeavePageComponent),
  },
  // Legacy route redirects so every old or bookmarked link resolves cleanly
  { path: 'dashboard', redirectTo: 'home', pathMatch: 'full' },
  { path: 'dm-game', redirectTo: 'arcane-screen', pathMatch: 'full' },
  { path: 'player-game', redirectTo: 'arcane-screen', pathMatch: 'full' },
  { path: 'loom-graph', redirectTo: 'weave', pathMatch: 'full' },
  { path: 'quests', redirectTo: 'campaigns', pathMatch: 'full' },
  { path: 'notes', redirectTo: 'loom', pathMatch: 'full' },
  { path: 'locations', redirectTo: 'campaigns', pathMatch: 'full' },
  { path: 'npcs', redirectTo: 'campaigns', pathMatch: 'full' },
  { path: 'monsters', redirectTo: 'encounters', pathMatch: 'full' },
  { path: 'spells', redirectTo: 'effects', pathMatch: 'full' },
  { path: 'items', redirectTo: 'assets', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' },
];
