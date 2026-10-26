import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { authInterceptor } from '../../Mythweaver.client/src/app/core/interceptors/auth.interceptor';
import { AppComponent } from './app/app.component';
document.title = 'Effect Builder Studio · LoomWeaver';
bootstrapApplication(AppComponent, { providers: [provideHttpClient(withInterceptors([authInterceptor])), provideRouter([
  { path: 'effect-builder', redirectTo: '', pathMatch: 'full' },
  { path: '', children: [] },
  { path: '**', redirectTo: '' }
])] }).catch(console.error);
