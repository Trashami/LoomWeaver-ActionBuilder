import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ActionStudioAppComponent } from './app/app.component';

bootstrapApplication(ActionStudioAppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter([]),
  ],
}).catch((err) => console.error('Failed to bootstrap ActionBuilder Studio:', err));
