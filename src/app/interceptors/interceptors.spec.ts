import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { environment } from 'src/environments/environment';
import { authInterceptor } from './auth.interceptor';
import { errorInterceptor } from './error.interceptor';

describe('Interceptores HTTP', () => {
  const api = environment.apiUrlAuth;
  let http: HttpClient;
  let control: HttpTestingController;
  let navegar: jasmine.Spy;
  let alerta: jasmine.Spy;

  beforeEach(() => {
    sessionStorage.setItem('token', 'token-actual');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    control = TestBed.inject(HttpTestingController);
    navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    alerta = spyOn(Swal, 'fire');
  });

  afterEach(() => {
    control.verify();
    sessionStorage.removeItem('token');
  });

  function fallar(url: string, status: number): jasmine.Spy {
    const error = jasmine.createSpy('error');
    http.get(url).subscribe({ error });
    const solicitud = control.expectOne(url);
    if (status === 0) {
      solicitud.error(new ProgressEvent('error'));
    } else {
      solicitud.flush({ message: 'x' }, { status, statusText: 'Error' });
    }
    return error;
  }

  it('agrega el Bearer solo a las rutas protegidas del API', () => {
    http.get(`${api}/cita/listar`).subscribe();
    http.post(`${api}/auth/login`, {}).subscribe();
    http.get('https://otro.test/datos').subscribe();
    expect(control.expectOne(`${api}/cita/listar`).request.headers.get('Authorization')).toBe('Bearer token-actual');
    expect(control.expectOne(`${api}/auth/login`).request.headers.has('Authorization')).toBeFalse();
    expect(control.expectOne('https://otro.test/datos').request.headers.has('Authorization')).toBeFalse();
  });

  it('no fija Content-Type al enviar FormData', () => {
    http.post(`${api}/inventario/carga/previsualizar`, new FormData()).subscribe();
    expect(control.expectOne(`${api}/inventario/carga/previsualizar`).request.headers.has('Content-Type')).toBeFalse();
  });

  it('ante un 401 cierra la sesión, avisa una sola vez y va a login', () => {
    http.get(`${api}/a`).subscribe({ error: () => undefined });
    http.get(`${api}/b`).subscribe({ error: () => undefined });
    control.expectOne(`${api}/a`).flush(null, { status: 401, statusText: 'x' });
    control.expectOne(`${api}/b`).flush(null, { status: 401, statusText: 'x' });
    expect(sessionStorage.getItem('token')).toBeNull();
    expect(navegar).toHaveBeenCalledOnceWith(['/login']);
    expect(alerta).toHaveBeenCalledTimes(1);
  });

  it('un 401 atrasado no cierra una sesión nueva', () => {
    http.get(`${api}/a`).subscribe({ error: () => undefined });
    sessionStorage.setItem('token', 'token-nuevo');
    control.expectOne(`${api}/a`).flush(null, { status: 401, statusText: 'x' });
    expect(sessionStorage.getItem('token')).toBe('token-nuevo');
    expect(navegar).not.toHaveBeenCalled();
  });

  for (const [status, titulo] of [[403, 'Acceso denegado'], [0, 'Error de comunicación'], [500, 'Error de comunicación']] as const) {
    it(`muestra un aviso ante un ${status} y propaga el error`, () => {
      const error = fallar(`${api}/a`, status);
      expect(alerta.calls.mostRecent().args[0]).toBe(titulo);
      expect(error).toHaveBeenCalled();
      expect(sessionStorage.getItem('token')).toBe('token-actual');
    });
  }

  it('deja los 400 y 409 a cada pantalla', () => {
    expect(fallar(`${api}/a`, 400)).toHaveBeenCalled();
    expect(fallar(`${api}/a`, 409)).toHaveBeenCalled();
    expect(alerta).not.toHaveBeenCalled();
  });

  it('no interviene en los errores del login', () => {
    fallar(`${api}/auth/login`, 500);
    expect(alerta).not.toHaveBeenCalled();
  });
});
