import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, RouterStateSnapshot, UrlTree } from '@angular/router';
import Swal from 'sweetalert2';
import { crearTokenPrueba } from '../testing/jwt.testing';
import { menuGuard } from './menu.guard';

describe('menuGuard', () => {
  let alerta: jasmine.Spy;
  const ejecutar = (data: Record<string, unknown>) => TestBed.runInInjectionContext(() =>
    menuGuard({ data } as unknown as ActivatedRouteSnapshot, {} as RouterStateSnapshot));

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] });
    alerta = spyOn(Swal, 'fire');
    sessionStorage.setItem('token', crearTokenPrueba({
      menus: JSON.stringify([
        { code: 'despacho', title: 'Despacho', activo: true },
        { code: 'tarifas', title: 'Tarifas', activo: false }
      ])
    }));
  });
  afterEach(() => sessionStorage.removeItem('token'));

  it('permite un menú activo', () => {
    expect(ejecutar({ menu: 'despacho' })).toBeTrue();
    expect(alerta).not.toHaveBeenCalled();
  });

  for (const data of [{ menu: 'usuarios' }, { menu: 'tarifas' }, {}]) {
    it(`avisa y redirige a inicio con ${JSON.stringify(data)}`, () => {
      const resultado = ejecutar(data);
      expect(resultado instanceof UrlTree && resultado.toString()).toBe('/inicio');
      expect(alerta).toHaveBeenCalledTimes(1);
    });
  }
});
