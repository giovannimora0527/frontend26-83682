import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AnotacionHistoria } from 'src/app/models/anotacion-historia';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

import { AnotacionHistoriaService } from './anotacion-historia.service';

describe('AnotacionHistoriaService', () => {
  let service: AnotacionHistoriaService;
  let backendService: jasmine.SpyObj<BackendService>;
  const anotacion: AnotacionHistoria = {
    id: 1,
    descripcion: 'Visita por problemas urinarios',
    diagnostico: 'Infección urinaria',
    observaciones: 'Control en una semana',
    fecha: '2026-01-01T00:01:00',
    historia: {
      id: 1,
      fechaCreacion: '2026-01-01T00:00:00',
      mascota: { mascotaId: 1 }
    },
    medico: {
      id: 1,
      tipoDocumento: 'CC',
      numeroDocumento: '1001001001',
      nombres: 'Juan',
      apellidos: 'Perez',
      telefono: '3001112233',
      registroProfesional: 'RP-1001',
      especializacionId: 13
    }
  };

  beforeEach(() => {
    backendService = jasmine.createSpyObj<BackendService>('BackendService', ['get', 'post', 'put']);
    TestBed.configureTestingModule({
      providers: [{ provide: BackendService, useValue: backendService }]
    });
    service = TestBed.inject(AnotacionHistoriaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create an annotation sending related ids', () => {
    backendService.post.and.returnValue(of(anotacion));
    const solicitud = {
      historiaId: 1, medicoId: 3, citaId: 1, descripcion: 'Control',
      diagnostico: 'Infección urinaria', observaciones: 'Control en una semana'
    };

    service.crearAnotacionHistoria(solicitud).subscribe(resultado => expect(resultado).toEqual(anotacion));

    expect(backendService.post).toHaveBeenCalledOnceWith(environment.apiUrlAuth, 'anotacion-historia', 'crear', solicitud);
  });

  it('should propagate backend errors', () => {
    const error = new Error('Error al crear la anotación');
    backendService.post.and.returnValue(throwError(() => error));

    service.crearAnotacionHistoria({
      historiaId: 1, medicoId: 3, citaId: 1, descripcion: 'Control', diagnostico: 'Infección', observaciones: 'Control'
    }).subscribe({
      next: () => fail('Expected a backend error'),
      error: recibido => expect(recibido).toBe(error)
    });
  });
});
