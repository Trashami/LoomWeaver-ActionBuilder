import { Routes } from '@angular/router';

export const APP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/effect-studio/effect-studio.page').then(
        (m) => m.EffectStudioPageComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
