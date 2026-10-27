import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LoomMapsStudioAppComponent } from './app/app.component';

bootstrapApplication(LoomMapsStudioAppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter([]),
  ],
}).catch((err) => console.error('Failed to bootstrap LoomMaps Studio:', err));
