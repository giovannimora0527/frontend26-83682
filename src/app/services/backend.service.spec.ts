import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { BackendService } from './backend.service';

describe('BackendService', () => {
  const api = environment.apiUrlAuth;
  let service: BackendService;
  let control: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(BackendService);
    control = TestBed.inject(HttpTestingController);
  });
  afterEach(() => control.verify());

  it('envía PATCH con su cuerpo', () => {
    service.patch(api, 'usuario', '3/estado', { activo: false }).subscribe();
    const { request } = control.expectOne(`${api}/usuario/3/estado`);
    expect(request.method).toBe('PATCH');
    expect(request.body).toEqual({ activo: false });
  });

  it('envía el archivo como FormData', () => {
    const datos = new FormData();
    service.postArchivo('inventario/carga/previsualizar', datos).subscribe();
    expect(control.expectOne(`${api}/inventario/carga/previsualizar`).request.body).toBe(datos);
  });

  for (const [texto, esperado] of [
    ['{"status":409,"message":"Sin datos"}', { status: 409, message: 'Sin datos' }],
    ['no es json', null]
  ] as const) {
    it(`convierte el error de una descarga: ${texto}`, async () => {
      const promesa = firstValueFrom(service.getBlob('factura/1/pdf'));
      control.expectOne(`${api}/factura/1/pdf`).flush(new Blob([texto]), { status: 409, statusText: 'Conflict' });
      const error = await promesa.then(() => fail('debía fallar'), (e: HttpErrorResponse) => e) as HttpErrorResponse;
      expect(error.status).toBe(409);
      expect(error.error).toEqual(esperado);
    });
  }
});
