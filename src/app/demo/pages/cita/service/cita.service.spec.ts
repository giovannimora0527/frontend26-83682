import { TestBed } from '@angular/core/testing';
import { HttpParams } from '@angular/common/http';
import { of } from 'rxjs';
import { BackendService } from 'src/app/services/backend.service';
import { environment } from 'src/environments/environment';

import { CitaService } from './cita.service';

describe('CitaService', () => {
  let service: CitaService;
  let backendService: jasmine.SpyObj<BackendService>;

  beforeEach(() => {
    backendService = jasmine.createSpyObj<BackendService>('BackendService', ['get', 'post', 'put', 'patch']);
    TestBed.configureTestingModule({
      providers: [{ provide: BackendService, useValue: backendService }]
    });
    service = TestBed.inject(CitaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should list appointments by pet sending mascotaId as a query param', () => {
    backendService.get.and.returnValue(of([]));

    service.listarCitasPorMascota(7).subscribe(citas => expect(citas).toEqual([]));

    const [url, api, endpoint, params] = backendService.get.calls.mostRecent().args;
    expect([url, api, endpoint]).toEqual([environment.apiUrlAuth, 'cita', 'listar-por-mascota']);
    expect((params as HttpParams).get('mascotaId')).toBe('7');
  });

  it('should cancel with a reason and reschedule using PATCH', () => {
    backendService.patch.and.returnValue(of({}));
    service.cambiarEstado(5, 'CANCELADA', 'Motivo').subscribe();
    expect(backendService.patch).toHaveBeenCalledWith(environment.apiUrlAuth, 'cita', '5/estado', { estado: 'CANCELADA', motivo: 'Motivo' });
    service.cambiarEstado(5, 'CONFIRMADA').subscribe();
    expect(backendService.patch).toHaveBeenCalledWith(environment.apiUrlAuth, 'cita', '5/estado', { estado: 'CONFIRMADA' });
    service.reprogramar(5, '2026-12-01T09:00:00').subscribe();
    expect(backendService.patch).toHaveBeenCalledWith(environment.apiUrlAuth, 'cita', '5/reprogramar', { fechaInicio: '2026-12-01T09:00:00' });
  });
});
