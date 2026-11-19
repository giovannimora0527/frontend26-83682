import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { MenuService } from '../services/menu.service';
import { authInterceptor } from './auth.interceptor';

describe('Sesión y menú de la clínica', () => {
  let auth: AuthService;
  let menus: MenuService;
  let http: HttpTestingController;
  let router: jasmine.SpyObj<Router>;
  const base = environment.apiUrlAuth;

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    router.navigateByUrl.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router }
      ]
    });
    auth = TestBed.inject(AuthService);
    menus = TestBed.inject(MenuService);
    http = TestBed.inject(HttpTestingController);
    auth.cerrarSesion();
  });

  afterEach(() => {
    http.verify();
    auth.cerrarSesion();
  });

  function iniciarSesion() {
    auth.iniciarSesion('usuario-de-prueba', crypto.randomUUID()).subscribe();
    const login = http.expectOne(base + '/auth/login');
    expect(login.request.headers.has('Authorization')).toBeFalse();
    login.flush({ token: 'token-de-prueba', tokenType: 'Bearer', usuarioId: 1,
      username: 'usuario-de-prueba', perfilId: 1, perfil: 'Administrador' });
  }

  it('carga el menú del JWT con una sola cabecera Bearer y borra la sesión al salir', () => {
    iniciarSesion();
    menus.obtenerMenusPropios().subscribe(items => expect(items.map(item => item.url))
      .toEqual(['/inicio/historias-medicas']));
    const menu = http.expectOne(base + '/menu/propio');
    expect(menu.request.headers.getAll('Authorization')).toEqual(['Bearer token-de-prueba']);
    expect(menu.request.headers.has('Content-Type')).toBeFalse();
    menu.flush([{ activo: true, code: 'historias', url: '/inicio/historias' }]);

    auth.cerrarSesion();
    expect(auth.obtenerToken()).toBeNull();
    expect(auth.obtenerUsuarioId()).toBeNull();
    expect(auth.obtenerPerfil()).toBeNull();
  });

  it('mantiene la sesión al recibir 403 y la elimina al recibir 401', () => {
    iniciarSesion();
    menus.obtenerMenusPropios().subscribe({ error: () => undefined });
    http.expectOne(base + '/menu/propio').flush({}, { status: 403, statusText: 'Forbidden' });
    expect(auth.tieneToken()).toBeTrue();
    expect(auth.avisoAcceso()).toContain('permiso');

    auth.validarSesion().subscribe({ error: () => undefined });
    http.expectOne(base + '/auth/validar').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(auth.tieneToken()).toBeFalse();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login', { replaceUrl: true });
  });
});
