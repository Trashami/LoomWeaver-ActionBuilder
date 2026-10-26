import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';

document.title = 'Effect Builder Studio · LoomWeaver';

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter([
      { path: 'effect-builder', redirectTo: '', pathMatch: 'full' },
      { path: '', children: [] },
      { path: '**', redirectTo: '' },
    ]),
  ],
}).catch(console.error);
