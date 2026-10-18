import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(UsuarioService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('usa las rutas del backend /usuario/listar, /usuario/guardar y /usuario/actualizar', () => {
    service.getUsuarios().subscribe();
    expect(http.expectOne('http://localhost:8080/clinica/v1/usuario/listar').request.method).toBe('GET');

    service.guardarUsuario({ username: 'ana', password: 'x', rol: 'ADMIN', email: 'ana@clinica.com' }).subscribe();
    expect(http.expectOne('http://localhost:8080/clinica/v1/usuario/guardar').request.method).toBe('POST');

    service.actualizarUsuario({ id: 1, username: 'ana', rol: 'ADMIN', email: 'ana@clinica.com' }).subscribe();
    expect(http.expectOne('http://localhost:8080/clinica/v1/usuario/actualizar').request.method).toBe('POST');
  });
});
