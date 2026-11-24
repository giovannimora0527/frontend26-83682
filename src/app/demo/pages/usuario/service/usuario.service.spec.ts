import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(UsuarioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normaliza el identificador de los perfiles', () => {
    let ids: number[] = [];
    service.listarPerfiles().subscribe((perfiles) => ids = perfiles.map(({ id }) => id));
    TestBed.inject(HttpTestingController).expectOne((req) => req.url.endsWith('/perfil/listar'))
      .flush([{ perfilId: 1, codigo: 'MEDICO', nombre: 'Medico' }, { id: 2, codigo: 'SECRETARIA', nombre: 'Recepcion' }]);
    expect(ids).toEqual([1, 2]);
  });
});
