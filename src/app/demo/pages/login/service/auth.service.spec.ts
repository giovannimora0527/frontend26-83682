import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
import { crearTokenPrueba } from 'src/app/testing/jwt.testing';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  for (const status of [200, 500]) {
    it(`cierra la sesión local cuando el backend responde ${status}`, () => {
      sessionStorage.setItem('token', crearTokenPrueba());
      const terminado = jasmine.createSpy('terminado');
      service.cerrarSesion().subscribe(terminado);
      const solicitud = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrlAuth}/auth/cerrar-sesion`);
      expect(solicitud.request.method).toBe('POST');
      solicitud.flush({}, { status, statusText: 'x' });
      expect(terminado).toHaveBeenCalled();
      expect(service.obtenerToken()).toBeNull();
    });
  }

  it('consulta el rol y los menús activos del token', () => {
    sessionStorage.setItem('token', crearTokenPrueba({
      rol: 'MEDICO',
      menus: JSON.stringify([
        { code: 'calendario', name: 'Calendario', activo: true },
        { code: 'citas', name: 'Citas', activo: false }
      ])
    }));
    expect(service.tieneRol('ADMINISTRADOR', 'MEDICO')).toBeTrue();
    expect(service.tieneRol('SECRETARIA')).toBeFalse();
    expect(service.tieneMenu('calendario')).toBeTrue();
    expect(service.tieneMenu('citas')).toBeFalse();
    sessionStorage.setItem('token', 'ilegible');
    expect(service.tieneRol('MEDICO')).toBeFalse();
    expect(service.tieneMenu('calendario')).toBeFalse();
    sessionStorage.removeItem('token');
  });
});
