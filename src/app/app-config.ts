import { HTTP_INTERCEPTORS, provideHttpClient } from "@angular/common/http";
import { ApplicationConfig } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling, withRouterConfig, withViewTransitions } from "@angular/router";
import { routes } from './app-routing.module';
import { HeadersInterceptor } from "./interceptors/headers.interceptor";

/**
 * Configuración global de la aplicación.
 * Centraliza la enrutación, el scroll, la navegación inicial y los interceptores HTTP.
 */
export const appConfig: ApplicationConfig = {
    providers: [
      /**
       * Provee el enrutador principal con URL limpias, scroll-restoration y transiciones de vista.
       * Se evita withHashLocation para mantener rutas amigables y de tipo SPA moderna.
       */
      provideRouter(
        routes,
        withRouterConfig({
          onSameUrlNavigation: 'reload'
        }),
        withInMemoryScrolling({
          scrollPositionRestoration: 'top',
          anchorScrolling: 'enabled'
        }),
        withEnabledBlockingInitialNavigation(),
        withViewTransitions()
      ),
      provideHttpClient(),
      provideAnimations(),
      {
        provide: HTTP_INTERCEPTORS,
        useClass: HeadersInterceptor,
        multi: true, // Permite múltiples interceptores
      }
    ]
  };