import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import { crearTokenPrueba } from '../testing/jwt.testing';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const ejecutar = () => TestBed.runInInjectionContext(() =>
    authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    sessionStorage.removeItem('token');
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
  });
  afterEach(() => sessionStorage.removeItem('token'));

  it('permite el acceso con un token vigente', () => {
    sessionStorage.setItem('token', crearTokenPrueba());
    expect(ejecutar()).toBeTrue();
  });

  for (const [caso, token] of [
    ['sin token', null],
    ['con un texto cualquiera', 'abc'],
    ['con un token vencido', crearTokenPrueba({ exp: 1 })]
  ] as const) {
    it(`redirige a login y limpia la sesión ${caso}`, () => {
      if (token) {
        sessionStorage.setItem('token', token);
      }
      const resultado = ejecutar();
      expect(resultado instanceof UrlTree && resultado.toString()).toBe('/login');
      expect(sessionStorage.getItem('token')).toBeNull();
    });
  }
});
