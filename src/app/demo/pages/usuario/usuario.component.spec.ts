import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { UsuarioComponent } from './usuario.component';

const API = 'http://localhost:8080/clinica/v1/usuario';

describe('UsuarioComponent', () => {
  let component: UsuarioComponent;
  let fixture: ComponentFixture<UsuarioComponent>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuarioComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    })
    .compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(UsuarioComponent);
    component = fixture.componentInstance;
    http.expectOne(`${API}/listar`).flush([
      { id: 29, username: 'gmora', rol: 'ADMIN', email: 'gmora@clinica.com', activo: true, fechaCreacion: '2025-11-06T20:59:54' }
    ]);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('lista los usuarios que devuelve GET /usuario/listar', () => {
    const filas = (fixture.nativeElement as HTMLElement).querySelectorAll('table tbody tr');
    expect(filas.length).toBe(1);
    expect(filas[0].textContent).toContain('gmora');
    expect(filas[0].textContent).toContain('ADMIN');
    expect(filas[0].textContent).toContain('Activo');
  });

  it('exige contraseña al crear y envía el JSON que espera el backend', () => {
    component.nuevoUsuario();
    component.form.patchValue({ username: 'ana', email: 'ana@clinica.com', rol: 'veterinario' });
    component.guardarUsuario();
    expect(component.form.invalid).toBeTrue();
    http.expectNone(`${API}/guardar`);

    component.form.patchValue({ password: 'secreta' });
    component.guardarUsuario();
    const peticion = http.expectOne(`${API}/guardar`);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      id: undefined, username: 'ana', email: 'ana@clinica.com', rol: 'VETERINARIO', activo: true, password: 'secreta'
    });
    peticion.flush({ status: 201, message: 'Usuario creado exitosamente' });
    http.expectOne(`${API}/listar`).flush([]);
  });

  it('al editar no exige contraseña y no la envía si se deja vacía', () => {
    component.abrirEdicion(component.listUsuarios[0]);
    component.form.patchValue({ rol: 'ADMIN', activo: false });
    component.guardarUsuario();
    const peticion = http.expectOne(`${API}/actualizar`);
    expect(peticion.request.body.id).toBe(29);
    expect(peticion.request.body.activo).toBeFalse();
    expect('password' in peticion.request.body).toBeFalse();
    peticion.flush({ status: 200, message: 'Usuario actualizado exitosamente' });
    http.expectOne(`${API}/listar`).flush([]);
  });
});
