import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router } from '@angular/router';
import { crearTokenPrueba } from './testing/jwt.testing';
import { NavigationItems } from './theme/layout/admin/navigation/navigation';
import { menuGuard } from './guards/menu.guard';
import { authGuard } from './guards/auth.guard';
import { routes } from './app-routing.module';

@Component({ selector: 'app-pantalla', template: '' })
class PantallaComponent {}

describe('Rutas', () => {
  const inicio = routes.find((ruta) => ruta.path === 'inicio');
  const hijas = inicio?.children?.filter((ruta) => ruta.component) ?? [];

  it('cada opción del menú tiene su ruta protegida por authGuard y menuGuard', () => {
    const opciones = NavigationItems.flatMap((grupo) => grupo.children ?? []);
    expect(inicio?.canActivateChild).toContain(authGuard);
    expect(hijas.filter((ruta) => !ruta.path?.includes(':')).map((ruta) => [ruta.data?.['menu'], `/inicio/${ruta.path}`])).toEqual(opciones.map(({ id, url }) => [id, url]));
    expect(hijas.every((ruta) => ruta.canActivate?.includes(menuGuard))).toBeTrue();
  });

  it('la ruta citas usa el código de menú cita', () => {
    expect(hijas.find((ruta) => ruta.path === 'citas')?.data?.['menu']).toBe('cita');
  });

  for (const [url, esperada] of [['/inicio', '/inicio'], ['/inicio/no-existe', '/inicio'], ['/no-existe', '/login']]) {
    it(`${url} lleva a ${esperada}`, async () => {
      sessionStorage.setItem('token', crearTokenPrueba());
      // Se conserva la configuración de rutas sin crear las pantallas.
      const sinPantalla = (ruta: Route): Route => ({
        ...ruta,
        ...(ruta.component ? { component: PantallaComponent } : {}),
        ...(ruta.children ? { children: ruta.children.map(sinPantalla) } : {})
      });
      TestBed.configureTestingModule({
        providers: [provideRouter(routes.map(sinPantalla)), provideHttpClient(), provideHttpClientTesting()]
      });
      const router = TestBed.inject(Router);
      await router.navigateByUrl(url);
      expect(router.url).toBe(esperada);
      sessionStorage.removeItem('token');
    });
  }
});
